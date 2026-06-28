import { pgTable, uuid, text, boolean, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { questionRoleEnum, questionDifficultyEnum, questionStatusEnum, timeUnitEnum } from './enums';

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  role: questionRoleEnum('role').notNull(),
  difficulty: questionDifficultyEnum('difficulty').notNull(),
  status: questionStatusEnum('status').notNull().default('draft'),
  repositoryUrl: text('repository_url').notNull(),
  startingBranch: text('starting_branch').notNull().default('main'),
  targetBranch: text('target_branch').notNull().default('solution'),
  timeLimitValue: integer('time_limit_value'),
  timeLimitUnit: timeUnitEnum('time_limit_unit'),
  hardStop: boolean('hard_stop').notNull().default(false),
  allowedModels: jsonb('allowed_models').$type<string[]>().notNull().default([]),
  ownerId: text('owner_id'),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
