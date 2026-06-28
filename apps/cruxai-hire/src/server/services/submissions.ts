import { db, schema } from '@/server/db';
import { and, eq, or, sql } from 'drizzle-orm';
import type { Submission, SubmissionStatus } from '@/types/recruiter';
import type { StoredMessage } from '@/types/stored-message';
import type { TimelineSnapshotSerialized } from '@/types/timeline';
import type { AnalysisResult, HireRecommendation } from '@/types/analysis';
import type { TestSummary } from '@/types/test-results';

function toSubmission(row: typeof schema.submissions.$inferSelect): Submission {
  return {
    id: row.id,
    inviteId: row.inviteId ?? null,
    userId: row.userId ?? null,
    questionId: row.questionId ?? null,
    sandboxId: row.sandboxId ?? null,
    status: row.status,
    chatMessages: row.chatMessages ?? [],
    snapshots: row.snapshots ?? [],
    analysisResult: row.analysisResult ?? null,
    hireRecommendation: row.hireRecommendation ?? null,
    hireReasoning: row.hireReasoning ?? null,
    timeSpent: row.timeSpent ?? null,
    timeExceeded: row.timeExceeded,
    tokensIn: row.tokensIn ?? undefined,
    tokensOut: row.tokensOut ?? undefined,
    messageCount: row.messageCount ?? undefined,
    startedAt: row.startedAt?.toISOString() ?? null,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    testSummary: row.testSummary ?? null,
  };
}

export async function listSubmissions(filters?: {
  inviteId?: string;
}): Promise<Submission[]> {
  let rows = await db.select().from(schema.submissions);
  if (filters?.inviteId) rows = rows.filter((r) => r.inviteId === filters.inviteId);
  return rows.map(toSubmission);
}

export async function listSubmissionsForViewer(viewerId: string): Promise<Submission[]> {
  // Submissions visible to a viewer:
  //   - rows where userId == viewerId (their own public-flow submissions)
  //   - rows where the invite's role is owned by viewerId (their recruiter view).
  //     Gating by role ownership — not question ownership — supports public questions,
  //     which have no owner but are invited against through the recruiter's own role.
  const rows = await db
    .select({ submission: schema.submissions })
    .from(schema.submissions)
    .leftJoin(schema.invites, eq(schema.submissions.inviteId, schema.invites.id))
    .leftJoin(schema.jobRoles, eq(schema.invites.roleId, schema.jobRoles.id))
    .where(
      or(
        eq(schema.submissions.userId, viewerId),
        eq(schema.jobRoles.ownerId, viewerId),
      )
    );
  return rows.map((r) => toSubmission(r.submission));
}

export async function listSubmissionsByInviteId(inviteId: string): Promise<Submission[]> {
  const rows = await db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.inviteId, inviteId));
  return rows.map(toSubmission);
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  const rows = await db.select().from(schema.submissions).where(eq(schema.submissions.id, id)).limit(1);
  return rows[0] ? toSubmission(rows[0]) : null;
}

export async function getSubmissionByInviteId(inviteId: string): Promise<Submission | null> {
  const rows = await db.select().from(schema.submissions).where(eq(schema.submissions.inviteId, inviteId)).limit(1);
  return rows[0] ? toSubmission(rows[0]) : null;
}

export async function getInProgressSubmissionByInviteId(inviteId: string): Promise<Submission | null> {
  const rows = await db.select()
    .from(schema.submissions)
    .where(and(
      eq(schema.submissions.inviteId, inviteId),
      eq(schema.submissions.status, 'in_progress')
    ))
    .limit(1);
  return rows[0] ? toSubmission(rows[0]) : null;
}

export async function createSubmissionFromInvite(data: {
  inviteId: string;
  questionId: string;
}): Promise<Submission> {
  const rows = await db.insert(schema.submissions).values({
    inviteId: data.inviteId,
    questionId: data.questionId,
    status: 'in_progress',
    startedAt: new Date(),
  }).returning();
  return toSubmission(rows[0]);
}

export async function createSubmissionForUser(data: {
  userId: string;
  questionId: string;
}): Promise<Submission> {
  const rows = await db.insert(schema.submissions).values({
    userId: data.userId,
    questionId: data.questionId,
    status: 'in_progress',
    startedAt: new Date(),
  }).returning();
  return toSubmission(rows[0]);
}

export async function updateSubmission(
  id: string,
  updates: Partial<{
    status: SubmissionStatus;
    sandboxId: string | null;
    chatMessages: StoredMessage[];
    snapshots: TimelineSnapshotSerialized[];
    analysisResult: AnalysisResult | null;
    timeSpent: string | null;
    timeExceeded: boolean;
    tokensIn: number;
    tokensOut: number;
    messageCount: number;
    startedAt: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
  }>
): Promise<Submission> {
  const { startedAt, submittedAt, reviewedAt, ...rest } = updates;
  await db.update(schema.submissions).set({
    ...rest,
    ...(startedAt !== undefined && { startedAt: startedAt ? new Date(startedAt) : null }),
    ...(submittedAt !== undefined && { submittedAt: submittedAt ? new Date(submittedAt) : null }),
    ...(reviewedAt !== undefined && { reviewedAt: reviewedAt ? new Date(reviewedAt) : null }),
    updatedAt: new Date(),
  }).where(eq(schema.submissions.id, id));
  const submission = await getSubmissionById(id);
  if (!submission) throw new Error(`Submission ${id} not found`);
  return submission;
}

export async function updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<Submission> {
  const timestampUpdates: Record<SubmissionStatus, Record<string, Date | null>> = {
    in_progress: { startedAt: new Date() },
    submitted: { submittedAt: new Date() },
    analyzing: {},
    analysis_failed: {},
    reviewed: { reviewedAt: new Date() },
  };
  await db.update(schema.submissions)
    .set({ status, ...timestampUpdates[status], updatedAt: new Date() })
    .where(eq(schema.submissions.id, id));
  const submission = await getSubmissionById(id);
  if (!submission) throw new Error(`Submission ${id} not found`);
  return submission;
}

export async function submitWithSession(
  id: string,
  sessionData: {
    snapshots?: TimelineSnapshotSerialized[];
    timeSpent?: string;
    timeExceeded?: boolean;
    messageCount?: number;
  }
): Promise<Submission> {
  await db.update(schema.submissions).set({
    status: 'submitted',
    submittedAt: new Date(),
    snapshots: sessionData.snapshots ?? [],
    timeSpent: sessionData.timeSpent ?? null,
    timeExceeded: sessionData.timeExceeded ?? false,
    messageCount: sessionData.messageCount ?? null,
    updatedAt: new Date(),
  }).where(eq(schema.submissions.id, id));
  const submission = await getSubmissionById(id);
  if (!submission) throw new Error(`Submission ${id} not found`);
  return submission;
}

export async function saveChatMessages(
  id: string,
  chatMessages: StoredMessage[],
  elapsedSeconds?: number
): Promise<void> {
  let messagesToSave = chatMessages;

  if (elapsedSeconds !== undefined) {
    // Read existing messages to preserve their elapsedSeconds values
    const rows = await db.select({ chatMessages: schema.submissions.chatMessages })
      .from(schema.submissions)
      .where(eq(schema.submissions.id, id))
      .limit(1);
    const existing: StoredMessage[] = rows[0]?.chatMessages ?? [];
    const existingById = new Map(existing.map((m) => [m.id, m]));

    // Stamp elapsedSeconds on the last user message that doesn't already have it
    let stampedLastUser = false;
    messagesToSave = [...chatMessages].reverse().map((msg) => {
      if (!stampedLastUser && msg.role === 'user' && existingById.get(msg.id)?.elapsedSeconds === undefined) {
        stampedLastUser = true;
        return { ...msg, elapsedSeconds };
      }
      // Preserve existing elapsedSeconds for previously saved messages
      const prev = existingById.get(msg.id);
      if (prev?.elapsedSeconds !== undefined) {
        return { ...msg, elapsedSeconds: prev.elapsedSeconds };
      }
      return msg;
    }).reverse();
  }

  await db.update(schema.submissions).set({
    chatMessages: messagesToSave,
    messageCount: messagesToSave.filter(m => m.role === 'user').length,
    updatedAt: new Date(),
  }).where(eq(schema.submissions.id, id));
}

export async function incrementTokenUsage(
  id: string,
  tokensIn: number,
  tokensOut: number
): Promise<void> {
  await db.update(schema.submissions).set({
    tokensIn: sql`COALESCE(${schema.submissions.tokensIn}, 0) + ${tokensIn}`,
    tokensOut: sql`COALESCE(${schema.submissions.tokensOut}, 0) + ${tokensOut}`,
    updatedAt: new Date(),
  }).where(eq(schema.submissions.id, id));
}

export async function saveHireRecommendation(
  id: string,
  data: { recommendation: HireRecommendation; reasoning: string }
): Promise<void> {
  await db.update(schema.submissions).set({
    hireRecommendation: data.recommendation,
    hireReasoning: data.reasoning,
    updatedAt: new Date(),
  }).where(eq(schema.submissions.id, id));
}

export async function saveTestSummary(id: string, summary: TestSummary): Promise<void> {
  await db.update(schema.submissions).set({
    testSummary: summary,
    updatedAt: new Date(),
  }).where(eq(schema.submissions.id, id));
}

export async function saveAnalysis(
  id: string,
  analysisResult: AnalysisResult
): Promise<Submission> {
  await db.update(schema.submissions).set({
    analysisResult,
    status: 'reviewed',
    reviewedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(schema.submissions.id, id));
  const submission = await getSubmissionById(id);
  if (!submission) throw new Error(`Submission ${id} not found`);
  return submission;
}
