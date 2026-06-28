import { db } from '@/server/db';
import { schema } from '@/server/db';
import { eq, or, inArray } from 'drizzle-orm';
import type { Question } from '@/types/question-shared';

function toQuestion(row: typeof schema.questions.$inferSelect): Question {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    role: row.role,
    difficulty: row.difficulty,
    status: row.status,
    ownerId: row.ownerId ?? null,
    isPublic: row.isPublic,
    repository: {
      url: row.repositoryUrl,
      startingBranch: row.startingBranch,
      targetBranch: row.targetBranch,
    },
    aiPermissions: {
      allowedModels: row.allowedModels,
    },
    timeConstraints: row.timeLimitValue
      ? {
          limit: row.timeLimitValue,
          unit: row.timeLimitUnit ?? 'minutes',
          hardStop: row.hardStop,
        }
      : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listQuestions(filters?: {
  ownerId?: string;
  ownedOnly?: boolean;
  status?: string;
  role?: string;
}): Promise<Question[]> {
  let rows: (typeof schema.questions.$inferSelect)[];
  if (filters?.ownerId) {
    rows = await db
      .select()
      .from(schema.questions)
      .where(
        filters.ownedOnly
          ? eq(schema.questions.ownerId, filters.ownerId)
          : or(
              eq(schema.questions.ownerId, filters.ownerId),
              eq(schema.questions.isPublic, true)
            )
      );
  } else {
    rows = await db.select().from(schema.questions);
  }
  let result = rows.map(toQuestion);
  if (filters?.status) result = result.filter((q) => q.status === filters.status);
  if (filters?.role) result = result.filter((q) => q.role === filters.role);
  return result;
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const rows = await db.select().from(schema.questions).where(eq(schema.questions.id, id)).limit(1);
  return rows[0] ? toQuestion(rows[0]) : null;
}

export async function getQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (ids.length === 0) return [];
  const rows = await db.select().from(schema.questions).where(inArray(schema.questions.id, ids));
  return rows.map(toQuestion);
}

export interface CreateQuestionData {
  title: string;
  description: string;
  role: Question['role'];
  difficulty: Question['difficulty'];
  status: Question['status'];
  repositoryUrl: string;
  startingBranch: string;
  targetBranch: string;
  ownerId?: string;
  isPublic?: boolean;
  timeLimitValue?: number;
  timeLimitUnit?: 'minutes' | 'hours';
  hardStop?: boolean;
  allowedModels?: string[];
}

export async function createQuestion(data: CreateQuestionData): Promise<Question> {
  const rows = await db.insert(schema.questions).values({
    title: data.title,
    description: data.description,
    role: data.role,
    difficulty: data.difficulty,
    status: data.status,
    repositoryUrl: data.repositoryUrl,
    startingBranch: data.startingBranch,
    targetBranch: data.targetBranch,
    ownerId: data.ownerId ?? null,
    isPublic: data.isPublic ?? false,
    timeLimitValue: data.timeLimitValue ?? null,
    timeLimitUnit: data.timeLimitUnit ?? null,
    hardStop: data.hardStop ?? false,
    allowedModels: data.allowedModels ?? [],
  }).returning();
  return toQuestion(rows[0]);
}

export async function updateQuestion(id: string, updates: Partial<Omit<CreateQuestionData, 'ownerId' | 'isPublic'>>): Promise<Question> {
  const rows = await db.update(schema.questions)
    .set({
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.role !== undefined && { role: updates.role }),
      ...(updates.difficulty !== undefined && { difficulty: updates.difficulty }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.repositoryUrl !== undefined && { repositoryUrl: updates.repositoryUrl }),
      ...(updates.startingBranch !== undefined && { startingBranch: updates.startingBranch }),
      ...(updates.targetBranch !== undefined && { targetBranch: updates.targetBranch }),
      ...(updates.timeLimitValue !== undefined && { timeLimitValue: updates.timeLimitValue }),
      ...(updates.timeLimitUnit !== undefined && { timeLimitUnit: updates.timeLimitUnit }),
      ...(updates.hardStop !== undefined && { hardStop: updates.hardStop }),
      ...(updates.allowedModels !== undefined && { allowedModels: updates.allowedModels }),
      updatedAt: new Date(),
    })
    .where(eq(schema.questions.id, id))
    .returning();
  return toQuestion(rows[0]);
}

export async function deleteQuestion(id: string): Promise<void> {
  await db.delete(schema.questions).where(eq(schema.questions.id, id));
}

export async function duplicateQuestion(id: string, ownerId?: string): Promise<Question> {
  const original = await getQuestionById(id);
  if (!original) throw new Error(`Question ${id} not found`);
  return createQuestion({
    title: `${original.title} (copy)`,
    description: original.description,
    role: original.role,
    difficulty: original.difficulty,
    status: 'draft',
    repositoryUrl: original.repository.url,
    startingBranch: original.repository.startingBranch,
    targetBranch: original.repository.targetBranch,
    ownerId: ownerId ?? original.ownerId ?? undefined,
    isPublic: false,
    timeLimitValue: original.timeConstraints?.limit,
    timeLimitUnit: original.timeConstraints?.unit,
    hardStop: original.timeConstraints?.hardStop,
    allowedModels: original.aiPermissions.allowedModels,
  });
}
