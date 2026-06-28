import { pgTable, uuid, integer, primaryKey } from 'drizzle-orm/pg-core';
import { jobRoles } from './job-roles';
import { questions } from './questions';

export const roleQuestionAssignments = pgTable(
  'role_question_assignments',
  {
    roleId: uuid('role_id').notNull().references(() => jobRoles.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.questionId] })],
);
