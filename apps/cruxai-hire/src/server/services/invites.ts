import { db, schema } from '@/server/db';
import { eq, and, inArray } from 'drizzle-orm';
import type { Invite } from '@/types/recruiter';
import { getCandidateById } from './candidates';
import { getRoleById } from './roles';
import { getQuestionById } from './questions';

export class InviteForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InviteForbiddenError';
  }
}

function toInvite(row: typeof schema.invites.$inferSelect): Invite {
  return {
    id: row.id,
    candidateId: row.candidateId,
    roleId: row.roleId,
    questionId: row.questionId,
    inviteCode: row.inviteCode,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listInvites(ownerId: string, filters?: {
  candidateId?: string;
  roleId?: string;
  questionId?: string;
}): Promise<Invite[]> {
  const conditions = [eq(schema.jobRoles.ownerId, ownerId)];
  if (filters?.candidateId) conditions.push(eq(schema.invites.candidateId, filters.candidateId));
  if (filters?.roleId) conditions.push(eq(schema.invites.roleId, filters.roleId));
  if (filters?.questionId) conditions.push(eq(schema.invites.questionId, filters.questionId));

  const rows = await db
    .select({ invite: schema.invites })
    .from(schema.invites)
    .innerJoin(schema.jobRoles, eq(schema.invites.roleId, schema.jobRoles.id))
    .where(and(...conditions));
  return rows.map((r) => toInvite(r.invite));
}

// Scoped lookup for recruiter operations: returns null if not owned by ownerId.
export async function getInviteByIdScoped(id: string, ownerId: string): Promise<Invite | null> {
  const rows = await db
    .select({ invite: schema.invites })
    .from(schema.invites)
    .innerJoin(schema.jobRoles, eq(schema.invites.roleId, schema.jobRoles.id))
    .where(and(eq(schema.invites.id, id), eq(schema.jobRoles.ownerId, ownerId)))
    .limit(1);
  return rows[0] ? toInvite(rows[0].invite) : null;
}

// Unscoped lookup for public flows (byCode, session, start).
// Access is gated by knowledge of the invite code or UUID, not recruiter ownership.
export async function getInviteByIdPublic(id: string): Promise<Invite | null> {
  const rows = await db.select().from(schema.invites).where(eq(schema.invites.id, id)).limit(1);
  return rows[0] ? toInvite(rows[0]) : null;
}

export async function getInviteByCode(code: string): Promise<Invite | null> {
  const rows = await db.select().from(schema.invites).where(eq(schema.invites.inviteCode, code)).limit(1);
  return rows[0] ? toInvite(rows[0]) : null;
}

export async function createInvite(data: {
  candidateId: string;
  roleId: string;
  questionId: string;
  inviteCode: string;
  notes?: string;
  ownerId: string;
}): Promise<Invite> {
  const [candidate, role, question] = await Promise.all([
    getCandidateById(data.candidateId, { ownerId: data.ownerId }),
    getRoleById(data.roleId),
    getQuestionById(data.questionId),
  ]);

  if (!candidate) throw new InviteForbiddenError('Candidate not owned by caller');
  if (!role || role.ownerId !== data.ownerId) throw new InviteForbiddenError('Role not owned by caller');
  if (!question) throw new InviteForbiddenError('Question not found');
  const questionAllowed = question.isPublic || question.ownerId === data.ownerId;
  if (!questionAllowed) throw new InviteForbiddenError('Question is private and not owned by caller');

  const rows = await db.insert(schema.invites).values({
    candidateId: data.candidateId,
    roleId: data.roleId,
    questionId: data.questionId,
    inviteCode: data.inviteCode,
    notes: data.notes ?? null,
  }).returning();
  return toInvite(rows[0]);
}

export async function deleteInvite(id: string, ownerId: string): Promise<boolean> {
  // Single atomic DELETE with ownership verified via subquery — no TOCTOU gap.
  const owned = db
    .select({ id: schema.jobRoles.id })
    .from(schema.jobRoles)
    .where(eq(schema.jobRoles.ownerId, ownerId));

  const rows = await db.delete(schema.invites)
    .where(and(eq(schema.invites.id, id), inArray(schema.invites.roleId, owned)))
    .returning({ id: schema.invites.id });
  return rows.length > 0;
}
