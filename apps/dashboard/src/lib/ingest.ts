/**
 * Precompute step shared by the dev seeder and the upload route.
 *
 * Given an employee id and their parsed `data.json`, run the Analyzer once and
 * write the derived rows — `employee_summary` (one row, overwritten) and
 * `daily_metrics` (replaced wholesale) — plus an `uploads` audit row, all in a
 * single transaction. The employee row must already exist; ingest never creates
 * it. Storing the raw `data.json` on disk is the caller's responsibility.
 */

import { eq } from 'drizzle-orm';

import { getDb, type DB } from './db';
import { dailyMetrics, employeeSummary, uploads } from './db/schema';
import { rehydrateAnalyzer, type DataJson } from './data-json';

export interface IngestOptions {
  /** Size of the stored `data.json` in bytes. Defaults to its serialized length. */
  bytes?: number;
  /** Upload timestamp. Defaults to now. */
  uploadedAt?: Date;
  /** Reuse an existing DB handle (e.g. to nest inside a larger transaction). */
  db?: DB;
}

export interface IngestResult {
  sessions: number;
  requests: number;
  credits: number;
  aiLoc: number;
  flowScore: number;
  /** Sessions-per-day series, oldest → newest. */
  daily: number[];
  /** Number of distinct days written to `daily_metrics`. */
  dailyDays: number;
}

interface DayAccumulator {
  sessions: number;
  requests: number;
  credits: number;
  aiLoc: number;
}

/** Merge one aligned label/value series into the per-date accumulator. */
function mergeSeries(
  acc: Map<string, DayAccumulator>,
  labels: string[],
  values: number[],
  key: keyof DayAccumulator,
): void {
  for (let i = 0; i < labels.length; i++) {
    const date = labels[i];
    const entry = acc.get(date) ?? { sessions: 0, requests: 0, credits: 0, aiLoc: 0 };
    entry[key] += values[i] ?? 0;
    acc.set(date, entry);
  }
}

/**
 * Analyze `dataJson` and persist the derived summary + daily rows for `employeeId`.
 * Idempotent per employee: re-ingesting replaces the summary and daily rows
 * rather than accumulating duplicates.
 */
export function ingest(employeeId: string, dataJson: DataJson, opts: IngestOptions = {}): IngestResult {
  const db = opts.db ?? getDb();

  const analyzer = rehydrateAnalyzer(dataJson);
  const stats = analyzer.getStats();
  const credits = analyzer.getAiCredits();
  const production = analyzer.getCodeProduction();
  const flow = analyzer.getFlowState();
  const daily = analyzer.getDailyActivity();

  // Build the per-date rows by merging the (independently-labeled) daily series.
  const byDate = new Map<string, DayAccumulator>();
  mergeSeries(byDate, daily.labels, daily.sessions, 'sessions');
  mergeSeries(byDate, daily.labels, daily.values, 'requests');
  mergeSeries(byDate, credits.daily.labels, credits.daily.credits, 'credits');
  mergeSeries(byDate, production.dailyTimeline.labels, production.dailyTimeline.aiLoc, 'aiLoc');

  const dailyRows = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      employeeId,
      date,
      sessions: Math.round(v.sessions),
      requests: Math.round(v.requests),
      credits: v.credits,
      aiLoc: Math.round(v.aiLoc),
    }));

  const summaryRow = {
    employeeId,
    sessions: stats.totalSessions,
    requests: stats.totalRequests,
    credits: credits.totalCredits,
    aiLoc: production.summary.totalAiLoc,
    flowScore: Math.round(flow.overallFlowScore),
    dailyJson: JSON.stringify(daily.sessions),
    computedAt: opts.uploadedAt ?? new Date(),
  };

  const bytes = opts.bytes ?? Buffer.byteLength(JSON.stringify(dataJson));
  const uploadedAt = opts.uploadedAt ?? new Date();

  db.transaction((tx) => {
    tx.insert(employeeSummary)
      .values(summaryRow)
      .onConflictDoUpdate({ target: employeeSummary.employeeId, set: summaryRow })
      .run();

    tx.delete(dailyMetrics).where(eq(dailyMetrics.employeeId, employeeId)).run();
    if (dailyRows.length > 0) {
      tx.insert(dailyMetrics).values(dailyRows).run();
    }

    tx.insert(uploads)
      .values({ employeeId, uploadedAt, bytes, sessionCount: stats.totalSessions })
      .run();
  });

  return {
    sessions: summaryRow.sessions,
    requests: summaryRow.requests,
    credits: summaryRow.credits,
    aiLoc: summaryRow.aiLoc,
    flowScore: summaryRow.flowScore,
    daily: daily.sessions,
    dailyDays: dailyRows.length,
  };
}
