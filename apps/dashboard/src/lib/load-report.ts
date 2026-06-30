import fs from 'node:fs/promises';
import path from 'node:path';
import { Analyzer } from '@crux/core';
import type { Session, Workspace } from '@crux/core';

interface DataJson {
  sessions: Session[];
  editLocIndex: [string, [string, number][]][];
  workspaces: [string, Workspace][];
}

export type LoadReportResult =
  | { ok: true; analyzer: Analyzer }
  | { ok: false; message: string };

export async function loadReport(): Promise<LoadReportResult> {
  const reportPath = process.env.CRUX_REPORT
    ? path.resolve(process.env.CRUX_REPORT)
    : path.resolve('./crux-report/data.json');

  let raw: DataJson;
  try {
    const text = await fs.readFile(reportPath, 'utf8');
    raw = JSON.parse(text) as DataJson;
  } catch (err) {
    const isNotFound = err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT';
    if (isNotFound) {
      return {
        ok: false,
        message: `No report found at ${reportPath}. Run \`crux scan\` to generate one.`,
      };
    }
    return {
      ok: false,
      message: `Could not read report: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const editLocIndex = new Map<string, Map<string, number>>(
    raw.editLocIndex.map(([reqId, entries]) => [reqId, new Map(entries)]),
  );
  const workspaces = new Map<string, Workspace>(raw.workspaces);
  const analyzer = new Analyzer(raw.sessions, editLocIndex, workspaces);

  return { ok: true, analyzer };
}
