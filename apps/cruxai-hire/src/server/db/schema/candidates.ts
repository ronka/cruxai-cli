import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const candidates = pgTable('candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  ownerId: text('owner_id').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  unique('candidates_owner_id_email_unique').on(table.ownerId, table.email),
]);
