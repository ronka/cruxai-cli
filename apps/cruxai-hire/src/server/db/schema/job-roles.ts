import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { roleStatusEnum } from './enums';

export const jobRoles = pgTable('job_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  ownerId: text('owner_id').notNull(),
  status: roleStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
