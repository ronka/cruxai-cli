import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { candidates } from './candidates';
import { jobRoles } from './job-roles';
import { questions } from './questions';

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => jobRoles.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  inviteCode: text('invite_code').notNull().unique(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
