import { pgTable, uuid, boolean, integer, text, jsonb, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { submissionStatusEnum, hireRecommendationEnum } from './enums';
import { invites } from './invites';
import { questions } from './questions';
import { user as authUser } from '@/lib/auth-schema';
import type { StoredMessage } from '@/types/stored-message';
import type { TimelineSnapshotSerialized } from '@/types/timeline';
import type { AnalysisResult } from '@/types/analysis';
import type { TestSummary } from '@/types/test-results';

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  inviteId: uuid('invite_id').references(() => invites.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => authUser.id, { onDelete: 'set null' }),
  questionId: uuid('question_id').references(() => questions.id, { onDelete: 'set null' }),
  sandboxId: text('sandbox_id'),
  status: submissionStatusEnum('status').notNull().default('in_progress'),
  chatMessages: jsonb('chat_messages').$type<StoredMessage[]>().default([]),
  snapshots: jsonb('snapshots').$type<TimelineSnapshotSerialized[]>().default([]),
  analysisResult: jsonb('analysis_result').$type<AnalysisResult | null>(),
  timeSpent: text('time_spent'),
  timeExceeded: boolean('time_exceeded').notNull().default(false),
  tokensIn: integer('tokens_in'),
  tokensOut: integer('tokens_out'),
  messageCount: integer('message_count'),
  hireRecommendation: hireRecommendationEnum('hire_recommendation'),
  hireReasoning: text('hire_reasoning'),
  testSummary: jsonb('test_summary').$type<TestSummary | null>(),
  startedAt: timestamp('started_at'),
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  identityCheck: check(
    'submissions_identity_check',
    sql`${table.inviteId} IS NOT NULL OR ${table.userId} IS NOT NULL`
  ),
}));
