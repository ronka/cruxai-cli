/**
 * DB-backed roster access — the replacement for the old `employees.ts` mock.
 *
 * Reads identity from `employees` and precomputed numbers from `employee_summary`
 * (no Analyzer). Shapes mirror the former mock module so pages keep compiling:
 * `Employee` still has `{ id, name, role, real, summary? }`, with `real` meaning
 * "backed by a real upload" (i.e. not a dev-seed mock).
 *
 * Server-only: importing this pulls in better-sqlite3 (a native addon). Do not
 * import from Client Components — import the `Employee` type only, which erases.
 */

import { eq, sql } from 'drizzle-orm';

import { getDb } from './db';
import { employees, employeeSummary, uploads } from './db/schema';

export interface EmployeeSummary {
  sessions: number;
  requests: number;
  /** USD. */
  credits: number;
  aiLoc: number;
  /** 0–100. */
  flowScore: number;
  /** Sparkline series, oldest → newest. */
  daily: number[];
}

export interface Employee {
  /** URL slug, e.g. "you", "a-cohen". */
  id: string;
  name: string;
  /** Group key / job classification, e.g. "Developers". */
  role: string;
  /** True for real uploads; false for dev-seed mock employees. */
  real: boolean;
  /** Dev-seed mock flag (inverse of `real`); kept explicit for admin/badging. */
  isMock: boolean;
  /** Epoch ms of the most recent upload, or null if none yet. */
  lastUploadAt: number | null;
  /** Present once the employee has been ingested at least once. */
  summary?: EmployeeSummary;
}

/** Stable id of the single real, data.json-backed employee created by the seed. */
export const REAL_EMPLOYEE_ID = 'you';

interface JoinedRow {
  id: string;
  name: string;
  role: string;
  isMock: boolean;
  sessions: number | null;
  requests: number | null;
  credits: number | null;
  aiLoc: number | null;
  flowScore: number | null;
  dailyJson: string | null;
  lastUploadAt: number | null;
}

function toEmployee(row: JoinedRow): Employee {
  const hasSummary = row.sessions != null;
  let daily: number[] = [];
  if (row.dailyJson) {
    try {
      const parsed = JSON.parse(row.dailyJson) as unknown;
      if (Array.isArray(parsed)) daily = parsed.filter((n): n is number => typeof n === 'number');
    } catch {
      daily = [];
    }
  }
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    real: !row.isMock,
    isMock: row.isMock,
    lastUploadAt: row.lastUploadAt,
    summary: hasSummary
      ? {
          sessions: row.sessions ?? 0,
          requests: row.requests ?? 0,
          credits: row.credits ?? 0,
          aiLoc: row.aiLoc ?? 0,
          flowScore: row.flowScore ?? 0,
          daily,
        }
      : undefined,
  };
}

/** All active employees with their precomputed summary, name-sorted. */
export function listEmployees(): Employee[] {
  const db = getDb();
  const lastUpload = db
    .select({
      employeeId: uploads.employeeId,
      lastUploadAt: sql<number>`max(${uploads.uploadedAt})`.as('last_upload_at'),
    })
    .from(uploads)
    .groupBy(uploads.employeeId)
    .as('last_upload');

  const rows = db
    .select({
      id: employees.id,
      name: employees.name,
      role: employees.role,
      isMock: employees.isMock,
      sessions: employeeSummary.sessions,
      requests: employeeSummary.requests,
      credits: employeeSummary.credits,
      aiLoc: employeeSummary.aiLoc,
      flowScore: employeeSummary.flowScore,
      dailyJson: employeeSummary.dailyJson,
      lastUploadAt: lastUpload.lastUploadAt,
    })
    .from(employees)
    .leftJoin(employeeSummary, eq(employeeSummary.employeeId, employees.id))
    .leftJoin(lastUpload, eq(lastUpload.employeeId, employees.id))
    .where(eq(employees.isActive, true))
    .orderBy(employees.name)
    .all();

  return rows.map(toEmployee);
}

/** A single employee by slug, or undefined if not found (active or not). */
export function getEmployee(id: string): Employee | undefined {
  const db = getDb();
  const row = db
    .select({
      id: employees.id,
      name: employees.name,
      role: employees.role,
      isMock: employees.isMock,
      sessions: employeeSummary.sessions,
      requests: employeeSummary.requests,
      credits: employeeSummary.credits,
      aiLoc: employeeSummary.aiLoc,
      flowScore: employeeSummary.flowScore,
      dailyJson: employeeSummary.dailyJson,
      lastUploadAt: sql<number | null>`(select max(${uploads.uploadedAt}) from ${uploads} where ${uploads.employeeId} = ${employees.id})`,
    })
    .from(employees)
    .leftJoin(employeeSummary, eq(employeeSummary.employeeId, employees.id))
    .where(eq(employees.id, id))
    .get();

  return row ? toEmployee(row) : undefined;
}

/** Group employees by role, preserving first-seen role order. */
export function getRoles(list: Employee[]): Record<string, Employee[]> {
  const groups: Record<string, Employee[]> = {};
  for (const emp of list) {
    (groups[emp.role] ??= []).push(emp);
  }
  return groups;
}

/** Look up an employee's display name without loading the full summary. */
export function getEmployeeName(id: string): string | undefined {
  const db = getDb();
  const row = db.select({ name: employees.name }).from(employees).where(eq(employees.id, id)).get();
  return row?.name;
}
