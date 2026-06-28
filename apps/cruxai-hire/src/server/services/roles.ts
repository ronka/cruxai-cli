import { db, schema } from '@/server/db';
import { eq, inArray, and } from 'drizzle-orm';
import type { JobRole, RoleStatus } from '@/types/recruiter';

async function getQuestionIdsForRoles(roleIds: string[]): Promise<Map<string, string[]>> {
  if (roleIds.length === 0) return new Map();
  const assignments = await db
    .select({ roleId: schema.roleQuestionAssignments.roleId, questionId: schema.roleQuestionAssignments.questionId })
    .from(schema.roleQuestionAssignments)
    .where(inArray(schema.roleQuestionAssignments.roleId, roleIds));
  const map = new Map<string, string[]>();
  for (const a of assignments) {
    const arr = map.get(a.roleId) ?? [];
    arr.push(a.questionId);
    map.set(a.roleId, arr);
  }
  return map;
}

function toJobRole(row: typeof schema.jobRoles.$inferSelect, questionIds: string[]): JobRole {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    ownerId: row.ownerId,
    status: row.status,
    questionIds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listRoles(filters?: { ownerId?: string; status?: string }): Promise<JobRole[]> {
  const conditions = [];
  if (filters?.ownerId) conditions.push(eq(schema.jobRoles.ownerId, filters.ownerId));
  const rows = conditions.length > 0
    ? await db.select().from(schema.jobRoles).where(and(...conditions))
    : await db.select().from(schema.jobRoles);
  let result = rows;
  if (filters?.status) result = result.filter((r) => r.status === filters.status);
  const questionIdsMap = await getQuestionIdsForRoles(result.map((r) => r.id));
  return result.map((r) => toJobRole(r, questionIdsMap.get(r.id) ?? []));
}

export async function getRoleById(id: string): Promise<JobRole | null> {
  const rows = await db.select().from(schema.jobRoles).where(eq(schema.jobRoles.id, id)).limit(1);
  if (!rows[0]) return null;
  const questionIdsMap = await getQuestionIdsForRoles([id]);
  return toJobRole(rows[0], questionIdsMap.get(id) ?? []);
}

export async function createRole(data: {
  title: string;
  description: string;
  ownerId: string;
  status: RoleStatus;
  questionIds: string[];
}): Promise<JobRole> {
  const rows = await db.insert(schema.jobRoles).values({
    title: data.title,
    description: data.description,
    ownerId: data.ownerId,
    status: data.status,
  }).returning();
  const role = rows[0];
  if (data.questionIds.length > 0) {
    await db.insert(schema.roleQuestionAssignments).values(
      data.questionIds.map((qId, i) => ({ roleId: role.id, questionId: qId, position: i }))
    );
  }
  return toJobRole(role, data.questionIds);
}

export async function updateRole(
  id: string,
  updates: Partial<{ title: string; description: string; status: RoleStatus; questionIds: string[] }>
): Promise<JobRole> {
  const { questionIds, ...fields } = updates;
  if (Object.keys(fields).length > 0) {
    await db.update(schema.jobRoles).set({ ...fields, updatedAt: new Date() }).where(eq(schema.jobRoles.id, id));
  }
  if (questionIds !== undefined) {
    await setRoleQuestions(id, questionIds);
  }
  const role = await getRoleById(id);
  if (!role) throw new Error(`Role ${id} not found`);
  return role;
}

export async function deleteRole(id: string): Promise<void> {
  await db.delete(schema.jobRoles).where(eq(schema.jobRoles.id, id));
}

export async function updateRoleStatus(id: string, status: RoleStatus): Promise<JobRole> {
  await db.update(schema.jobRoles).set({ status, updatedAt: new Date() }).where(eq(schema.jobRoles.id, id));
  const role = await getRoleById(id);
  if (!role) throw new Error(`Role ${id} not found`);
  return role;
}

export async function setRoleQuestions(roleId: string, questionIds: string[]): Promise<void> {
  await db.delete(schema.roleQuestionAssignments).where(eq(schema.roleQuestionAssignments.roleId, roleId));
  if (questionIds.length > 0) {
    await db.insert(schema.roleQuestionAssignments).values(
      questionIds.map((qId, i) => ({ roleId, questionId: qId, position: i }))
    );
  }
}
