/**
 * The `data.json` wire format and its rehydration into an Analyzer.
 *
 * `data.json` is the serialized `ParseResult` `crux scan` writes: Maps encoded as
 * `[key, value][]` arrays. This module is the single place that turns that wire
 * form back into a live `@crux/core` Analyzer — shared by `ingest.ts` (upload /
 * seed precompute) and the per-employee detail-page loader.
 */

import { Analyzer } from '@crux/core';
import type { Session, Workspace } from '@crux/core';

export interface DataJson {
  sessions: Session[];
  editLocIndex: [string, [string, number][]][];
  workspaces: [string, Workspace][];
}

/** True when `value` structurally matches the `data.json` wire format. */
export function isDataJson(value: unknown): value is DataJson {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.sessions) && Array.isArray(v.editLocIndex) && Array.isArray(v.workspaces);
}

/** Rebuild an Analyzer from a parsed `data.json`. */
export function rehydrateAnalyzer(raw: DataJson): Analyzer {
  const editLocIndex = new Map<string, Map<string, number>>(
    raw.editLocIndex.map(([reqId, entries]) => [reqId, new Map(entries)]),
  );
  const workspaces = new Map<string, Workspace>(raw.workspaces);
  return new Analyzer(raw.sessions, editLocIndex, workspaces);
}
