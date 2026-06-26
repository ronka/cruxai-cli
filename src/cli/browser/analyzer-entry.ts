/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Browser entry for dist/scan/analyzer.js.
 * Loads the baked ParseResult from window.__cruxData, constructs an Analyzer,
 * and exposes window.__cruxRpc for the app.js bundle to dispatch RPC calls locally. */

import { Analyzer } from '../../core/analyzer';
import type { Workspace, DateFilter, Session, SessionRequest } from '../../core/types';
import { getAllRules, getRulePreviewStats, getRule, registerPersonalRuleSource, registerProjectRuleSource } from '../../core/rule-engine';
import { runDetectors, runEmitters } from '../../core/detector-registry';
import { isoWeek } from '../../core/helpers';

interface BakedRule { id: string; source: string; filePath: string; layer: 'personal' | 'project'; }

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
    __cruxRules?: BakedRule[];
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

/** Resolve a date filter from params that wrap it as `{ filter: {...} }`
 *  (Context Health pages), falling back to the top-level filter `f`. */
function filterParam(params: Record<string, unknown>, f: DateFilter | undefined): DateFilter | undefined {
  if (typeof params.filter === 'object' && params.filter) {
    return validateDateFilter(params.filter as Record<string, unknown>);
  }
  return f;
}

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

// Register on-disk personal/project rules baked into the report at scan time.
for (const r of window.__cruxRules ?? []) {
  if (r.layer === 'project') registerProjectRuleSource(r.id, r.source, r.filePath);
  else registerPersonalRuleSource(r.id, r.source, r.filePath);
}

function skipIdeFor(f?: DateFilter): boolean {
  return !!(f?.harness && !f.harness.startsWith('Local Agent') && f.harness !== 'Xcode');
}

// Build the Rules-tab payload from the bundled built-in rules. Personal/project
// rules live on disk and are not available in an offline scan report.
function buildRuleEditor(f?: DateFilter): unknown {
  const reqs = analyzer.filterRequests(f);
  const filteredSessions = analyzer.filterSessions(f);
  const skipIde = skipIdeFor(f);
  const detectorResults = runDetectors(reqs, filteredSessions, skipIde);
  const emissions = runEmitters(reqs, filteredSessions, skipIde);
  const previews = getRulePreviewStats(reqs, filteredSessions, skipIde, detectorResults, emissions);
  const rules = getAllRules().map(r => ({
    id: r.id,
    name: r.name,
    group: r.group,
    severity: r.severity,
    scope: r.scope,
    requiresIdeContext: r.requiresIdeContext,
    description: r.descriptionTemplate
      ? r.descriptionTemplate.replaceAll(/\{\{[^}]+\}\}/g, '...').substring(0, 200)
      : r.name,
    descriptionTemplate: r.descriptionTemplate,
    suggestionTemplate: r.suggestionTemplate,
    exampleTemplate: r.exampleTemplate,
    thresholds: r.thresholds,
    tags: r.tags,
    source: r.source,
    sourceFilePath: r.sourceFilePath,
    version: r.version,
    rawSource: '',
  }));
  const layerCount = (src: string): number => rules.filter(r => r.source === src).length;
  const baked = window.__cruxRules ?? [];
  const personalDir = baked.find(b => b.layer === 'personal')?.filePath.replace(/[/\\][^/\\]+$/, '') ?? '';
  const projectDir = baked.find(b => b.layer === 'project')?.filePath.replace(/[/\\][^/\\]+$/, '') ?? '';
  const layers = [
    { layer: 'built-in', directory: '', exists: true, ruleCount: layerCount('built-in') },
    { layer: 'personal', directory: personalDir, exists: personalDir !== '', ruleCount: layerCount('personal') },
    { layer: 'project', directory: projectDir, exists: projectDir !== '', ruleCount: layerCount('project') },
  ];

  // Per-rule weekly date histograms (last 8 weeks).
  const weekBuckets = new Map<string, SessionRequest[]>();
  for (const r of reqs) {
    if (!r.timestamp) continue;
    const wk = isoWeek(new Date(r.timestamp));
    if (!weekBuckets.has(wk)) weekBuckets.set(wk, []);
    weekBuckets.get(wk)!.push(r);
  }
  const sortedWeeks = Array.from(weekBuckets.keys()).sort().slice(-8);
  const dateHistograms: Record<string, { labels: string[]; counts: number[] }> = {};
  if (sortedWeeks.length >= 2) {
    const weekEmissions = new Map<string, Map<string, number>>();
    for (const wk of sortedWeeks) {
      const wkReqs = weekBuckets.get(wk) || [];
      const wkEmissions = runEmitters(wkReqs, filteredSessions, skipIde);
      const counts = new Map<string, number>();
      for (const [ruleId, emission] of wkEmissions) counts.set(ruleId, emission.count);
      weekEmissions.set(wk, counts);
    }
    for (const rule of rules) {
      dateHistograms[rule.id] = { labels: sortedWeeks, counts: sortedWeeks.map(wk => weekEmissions.get(wk)?.get(rule.id) ?? 0) };
    }
  }

  return { rules, previews, layers, pending: [], dateHistograms };
}

function buildRulePreview(ruleId: string, f?: DateFilter): unknown {
  const rule = getRule(ruleId);
  if (!rule) return { ruleId, triggered: false, occurrences: 0, total: 0, pct: 0, severity: 'low', group: 'prompt-quality', previewDescription: 'Rule not found.', previewExamples: [] };
  const reqs = analyzer.filterRequests(f);
  const filteredSessions = analyzer.filterSessions(f);
  const skipIde = skipIdeFor(f);
  const detectorResults = runDetectors(reqs, filteredSessions, skipIde);
  const emissions = runEmitters(reqs, filteredSessions, skipIde);
  const previews = getRulePreviewStats(reqs, filteredSessions, skipIde, detectorResults, emissions);
  return previews.find(p => p.ruleId === ruleId)
    || { ruleId, triggered: false, occurrences: 0, total: 0, pct: 0, severity: rule.severity, group: rule.group, previewDescription: 'No data.', previewExamples: [] };
}

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
    // Context Health page — Config Quality + Context Management sub-tabs.
    // These pass the date filter wrapped as `{ filter: ... }`.
    case 'getConfigHealth': return analyzer.getConfigHealth(f);
    case 'getContextManagement': return analyzer.getContextManagement(filterParam(params, f));
    case 'getContextRangeAvailability': return analyzer.getContextRangeAvailability(filterParam(params, f));
    case 'getWorkspaceContextSessions':
      return typeof params.workspaceId === 'string'
        ? analyzer.getWorkspaceContextSessions(params.workspaceId, filterParam(params, f))
        : null;
    case 'getCapabilities': return { host: 'canvas', llm: false };
    // Built-in rules are baked into the scan bundle; expose them read-only.
    // Personal/project (on-disk) rules remain unavailable in an offline report.
    case 'getRuleEditor': return buildRuleEditor(f);
    case 'getRulePreview': return buildRulePreview(typeof params.ruleId === 'string' ? params.ruleId : '', f);
    case 'getRuleSource': return null;
    case 'createRule': case 'updateRule': case 'deleteRule': case 'trustRule': case 'denyRule':
      throw new Error('Rule editing is not available in offline scan reports.');
    default: throw new Error(`Unsupported RPC method in scan report: ${method}`);
  }
};
