/**
 * Drizzle schema for the dashboard's SQLite store.
 *
 * SQLite holds identity + precomputed metadata only; each employee's raw
 * `data.json` lives on disk under `<CRUX_DATA_DIR>/employees/<id>/`. See
 * `apps/dashboard/CONTEXT.md` and the manager-ready plan for the architecture.
 */

import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** One person whose crux usage is analyzed. `id` is the URL slug. */
export const employees = sqliteTable('employees', {
  /** URL slug, e.g. "you", "a-cohen". */
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  /** Group key / job classification, e.g. "Developers". */
  role: text('role').notNull(),
  /** SHA-256 hex of the per-employee upload token; null until a token is issued. */
  tokenHash: text('token_hash'),
  /** 1 for deterministic dev-seed employees, 0 for real uploads. */
  isMock: integer('is_mock', { mode: 'boolean' }).notNull().default(false),
  /** 0 hides the employee from the roster/aggregates but keeps their data. */
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/** One row per accepted upload (or seed) for an employee. */
export const uploads = sqliteTable(
  'uploads',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    employeeId: text('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    uploadedAt: integer('uploaded_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    /** Size of the stored data.json in bytes. */
    bytes: integer('bytes').notNull(),
    sessionCount: integer('session_count').notNull(),
  },
  (t) => [index('uploads_employee_idx').on(t.employeeId)],
);

/**
 * Precomputed per-employee summary — one row per employee, overwritten on each
 * upload. The roster and team-aggregate pages read only this table (no Analyzer).
 */
export const employeeSummary = sqliteTable('employee_summary', {
  employeeId: text('employee_id')
    .primaryKey()
    .references(() => employees.id, { onDelete: 'cascade' }),
  sessions: integer('sessions').notNull().default(0),
  requests: integer('requests').notNull().default(0),
  /** USD. */
  credits: real('credits').notNull().default(0),
  aiLoc: integer('ai_loc').notNull().default(0),
  /** 0–100. */
  flowScore: integer('flow_score').notNull().default(0),
  /** Sparkline series (sessions per day, oldest → newest) as a JSON number[]. */
  dailyJson: text('daily_json').notNull().default('[]'),
  computedAt: integer('computed_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/**
 * Per-employee, per-day metrics — the source for time-filtered team/compare
 * numbers (Task 8). Written from the Analyzer's daily activity at ingest time.
 */
export const dailyMetrics = sqliteTable(
  'daily_metrics',
  {
    employeeId: text('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    /** ISO date, `YYYY-MM-DD`. */
    date: text('date').notNull(),
    sessions: integer('sessions').notNull().default(0),
    requests: integer('requests').notNull().default(0),
    credits: real('credits').notNull().default(0),
    aiLoc: integer('ai_loc').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.employeeId, t.date] })],
);

export type EmployeeRow = typeof employees.$inferSelect;
export type UploadRow = typeof uploads.$inferSelect;
export type EmployeeSummaryRow = typeof employeeSummary.$inferSelect;
export type DailyMetricRow = typeof dailyMetrics.$inferSelect;
