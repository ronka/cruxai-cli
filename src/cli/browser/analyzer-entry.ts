/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Browser entry for dist/scan/analyzer.js.
 * Loads the baked ParseResult from window.__cruxData, constructs an Analyzer,
 * and exposes window.__cruxRpc for the app.js bundle to dispatch RPC calls locally. */

import { Analyzer } from '../../core/analyzer';
import type { Workspace, DateFilter, Session } from '../../core/types';

interface DataJson {
  sessions: Session[];
  editLocIndex: [string, [string, number][]][];
  workspaces: [string, Workspace][];
}

declare global {
  interface Window {
    __cruxData?: DataJson;
    __cruxRpc?: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
    __cruxConfig?: { from?: string; to?: string; workspace?: string; harness?: string };
  }
}

function rehydrateData(raw: DataJson) {
  const editLocIndex = new Map<string, Map<string, number>>(
    raw.editLocIndex.map(([reqId, entries]) => [reqId, new Map(entries)]),
  );
  const workspaces = new Map<string, Workspace>(raw.workspaces);
  return { sessions: raw.sessions, editLocIndex, workspaces };
}

// CLI flags baked in at scan time — applied as a floor for every filter-aware RPC call.
const cfgFilter: DateFilter = (() => {
  const cfg = window.__cruxConfig ?? {};
  const f: DateFilter = {};
  if (cfg.from) f.fromDate = cfg.from;
  if (cfg.to) f.toDate = cfg.to;
  return f;
})();

function validateDateFilter(params: Record<string, unknown>): DateFilter | undefined {
  const f: DateFilter = { ...cfgFilter };
  if (typeof params.fromDate === 'string') f.fromDate = params.fromDate;
  if (typeof params.toDate === 'string') f.toDate = params.toDate;
  if (typeof params.workspaceId === 'string') f.workspaceId = params.workspaceId;
  else if (typeof params.workspace === 'string') f.workspaceId = params.workspace;
  if (typeof params.harness === 'string') f.harness = params.harness;
  return Object.keys(f).length > 0 ? f : undefined;
}

const raw = window.__cruxData;
if (!raw) throw new Error('window.__cruxData is not defined — index.html is malformed');

const { sessions, editLocIndex, workspaces } = rehydrateData(raw);
const analyzer = new Analyzer(sessions, editLocIndex, workspaces);

window.__cruxRpc = async function cruxRpc(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const f = validateDateFilter(params);
  switch (method) {
    case 'getStats': return analyzer.getStats(f);
    case 'getWorkspaces': return analyzer.getWorkspaces();
    case 'getHarnesses': return analyzer.getHarnesses();
    case 'getHarnessBreakdown': return analyzer.getHarnessBreakdown(f);
    case 'getDailyActivity': return analyzer.getDailyActivity(f);
    case 'getWorkspaceBreakdown': return analyzer.getWorkspaceBreakdown(f);
    case 'getHourlyDistribution': return analyzer.getHourlyDistribution(f);
    case 'getHeatmap': return analyzer.getHeatmap(f);
    case 'getCodeProduction': return analyzer.getCodeProduction(f);
    case 'getDayTimeline': return analyzer.getDayTimeline(
      typeof params.date === 'string' ? params.date : undefined,
      typeof params.mode === 'string' ? params.mode : undefined,
      typeof params.filter === 'object' && params.filter ? validateDateFilter(params.filter as Record<string, unknown>) : f,
    );
    case 'getSessions': return analyzer.getSessions(
      typeof params.page === 'number' ? params.page : 1,
      typeof params.pageSize === 'number' ? Math.min(params.pageSize, 100) : 20,
      typeof params.filter === 'object' && params.filter ? validateDateFilter(params.filter as Record<string, unknown>) : f,
      typeof params.search === 'string' ? params.search : undefined,
    );
    case 'getSessionDetail': return typeof params.sessionId === 'string' ? analyzer.getSessionDetail(params.sessionId) : null;
    case 'getWorkLifeBalance': return analyzer.getWorkLifeBalance(f);
    case 'getAntiPatterns': return analyzer.getAntiPatterns(f);
    case 'getHarnessComparison': return analyzer.getHarnessComparison(f);
    case 'getPatterns':
    case 'getRecommendations': return analyzer.getRecommendations(f);
    case 'getProjectOverview': return analyzer.getProjectOverview(f);
    case 'getCalendarActivity': return analyzer.getCalendarActivity(f);
    case 'getCapabilities': return { host: 'canvas', llm: false };
    // Rule Editor / rule-loader methods: return empty stubs (markdown rules not available in browser)
    case 'getRuleEditor': return { rules: [], previews: [], layers: [], pending: [], dateHistograms: {} };
    case 'getRuleSource': return null;
    case 'createRule': case 'updateRule': case 'deleteRule': case 'trustRule': case 'denyRule':
      throw new Error('Rule editing is not available in offline scan reports.');
    default: throw new Error(`Unsupported RPC method in scan report: ${method}`);
  }
};
