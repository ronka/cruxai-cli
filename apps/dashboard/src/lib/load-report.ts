/**
 * Per-employee Analyzer loader for the detail pages.
 *
 * Reads an employee's raw `data.json` from `<CRUX_DATA_DIR>/employees/<id>/`,
 * rehydrates it into a `@crux/core` Analyzer, and caches the result in-memory
 * keyed by employee id + file mtime so repeated page renders don't re-parse.
 * The roster and team-aggregate pages never touch this — they read SQLite.
 */

import fs from 'node:fs/promises';
import { Analyzer } from '@crux/core';

import { employeeDataPath } from './paths';
import { rehydrateAnalyzer, type DataJson } from './data-json';

export type LoadReportResult =
  | { ok: true; analyzer: Analyzer }
  | { ok: false; message: string };

interface CacheEntry {
  mtimeMs: number;
  analyzer: Analyzer;
}

const cache = new Map<string, CacheEntry>();

/**
 * Load the Analyzer for a single employee. Cached by data.json mtime, so a fresh
 * upload (which rewrites the file) transparently invalidates the entry.
 */
export async function loadEmployeeReport(employeeId: string): Promise<LoadReportResult> {
  const dataPath = employeeDataPath(employeeId);

  let mtimeMs: number;
  try {
    mtimeMs = (await fs.stat(dataPath)).mtimeMs;
  } catch {
    return {
      ok: false,
      message: `No data for this employee yet. Run \`crux scan --upload\` (or \`pnpm dev:seed\`).`,
    };
  }

  const cached = cache.get(employeeId);
  if (cached && cached.mtimeMs === mtimeMs) {
    return { ok: true, analyzer: cached.analyzer };
  }

  let raw: DataJson;
  try {
    const text = await fs.readFile(dataPath, 'utf8');
    raw = JSON.parse(text) as DataJson;
  } catch (err) {
    return {
      ok: false,
      message: `Could not read data for this employee: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const analyzer = rehydrateAnalyzer(raw);
  cache.set(employeeId, { mtimeMs, analyzer });
  return { ok: true, analyzer };
}
