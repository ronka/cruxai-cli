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
import {
  getUserContext,
  buildClusterSummaries,
  buildTriagePrompt,
  validateTriage,
  buildCatalogTriagePrompt,
  validateCatalogPicks,
  buildSkillContentPrompt,
  parseSkillMarkdown,
  SCHEMA_TRIAGE,
  SCHEMA_CATALOG_PICKS,
} from '../../core/skill-finder';
import { createAnthropicClient } from '../../core/llm-client';
import { getCatalogItems } from '../../webview/panel-catalog';

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

// Runtime API key — held in memory only, never written to disk or localStorage.
let runtimeApiKey: string | undefined;

function triggerDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
    case 'getCapabilities': return { host: 'canvas', llm: !!runtimeApiKey };
    case 'setApiKey': {
      const key = typeof params.apiKey === 'string' ? params.apiKey.trim() : '';
      runtimeApiKey = key || undefined;
      return { ok: true, llm: !!runtimeApiKey };
    }
    case 'getWorkflowOptimization': return analyzer.getWorkflowOptimization(f);
    case 'triageSkills': {
      if (!runtimeApiKey) throw new Error('API key required. Enter your Anthropic key in the Skill Finder.');
      const clustersRaw = Array.isArray(params.clusters) ? params.clusters as Record<string, unknown>[] : [];
      const clusterSummaries = buildClusterSummaries(
        clustersRaw.map(entry => ({
          id: typeof entry.id === 'string' ? entry.id : '',
          label: typeof entry.label === 'string' ? entry.label : '',
          canonicalPrompt: '',
          occurrences: typeof entry.occurrences === 'number' ? entry.occurrences : 0,
          sessions: typeof entry.sessions === 'number' ? entry.sessions : 0,
          workspaces: Array.isArray(entry.workspaces) ? entry.workspaces as string[] : [],
          harnesses: [],
          avgCorrectionTurns: typeof entry.avgCorrectionTurns === 'number' ? entry.avgCorrectionTurns : 0,
          totalTurns: 0,
          cancelRate: typeof entry.cancelRate === 'number' ? entry.cancelRate : 0,
          firstSeen: null, lastSeen: null,
          examples: Array.isArray(entry.examples) ? entry.examples as string[] : [],
          skillDraft: '',
        })),
      );
      const context = getUserContext(sessions);
      const workspace = typeof params.workspace === 'string' ? params.workspace : undefined;
      const { system, user } = buildTriagePrompt(clusterSummaries, context, workspace);
      const llm = createAnthropicClient({ apiKey: runtimeApiKey, directBrowserAccess: true });
      const raw2 = await llm.completeJson<unknown>(
        [{ role: 'user', content: system }, { role: 'user', content: user }],
        SCHEMA_TRIAGE,
      );
      return { triaged: validateTriage(raw2, clusterSummaries) };
    }
    case 'discoverCatalog': {
      const items = (await getCatalogItems()).map(item => ({ ...item, relevanceScore: 0, matchReasons: [] }));
      return { items, totalScanned: items.length };
    }
    case 'triageCatalog': {
      if (!runtimeApiKey) throw new Error('API key required. Enter your Anthropic key in the Skill Finder.');
      const itemsRaw = Array.isArray(params.items) ? params.items as Record<string, unknown>[] : [];
      const candidates = itemsRaw.map(item => ({
        id: typeof item.id === 'string' ? item.id : '',
        kind: typeof item.kind === 'string' ? item.kind : '',
        title: typeof item.title === 'string' ? item.title : '',
        description: typeof item.description === 'string' ? item.description.slice(0, 120) : '',
        category: typeof item.category === 'string' ? item.category : '',
        path: typeof item.path === 'string' ? item.path : undefined,
        url: typeof item.url === 'string' ? item.url : undefined,
      }));
      const clustersRaw2 = Array.isArray(params.clusters) ? params.clusters as Record<string, unknown>[] : [];
      const clusterSummaries2 = buildClusterSummaries(
        clustersRaw2.slice(0, 30).map(entry => ({
          id: '', label: typeof entry.label === 'string' ? entry.label : '',
          canonicalPrompt: '', occurrences: typeof entry.occurrences === 'number' ? entry.occurrences : 0,
          sessions: 0, workspaces: Array.isArray(entry.workspaces) ? entry.workspaces as string[] : [],
          harnesses: [], avgCorrectionTurns: 0, totalTurns: 0, cancelRate: 0,
          firstSeen: null, lastSeen: null,
          examples: Array.isArray(entry.examples) ? entry.examples as string[] : [],
          skillDraft: '',
        })),
      );
      const context2 = getUserContext(sessions);
      const workspace2 = typeof params.workspace === 'string' ? params.workspace : undefined;
      const { system: catSys, user: catUser } = buildCatalogTriagePrompt(candidates, clusterSummaries2, context2, workspace2);
      const llm2 = createAnthropicClient({ apiKey: runtimeApiKey, directBrowserAccess: true });
      const catRaw = await llm2.completeJson<unknown>(
        [{ role: 'user', content: catSys }, { role: 'user', content: catUser }],
        SCHEMA_CATALOG_PICKS,
      );
      const rawCatalog = await getCatalogItems();
      return { items: validateCatalogPicks(catRaw, rawCatalog) };
    }
    case 'generateSkillContent': {
      if (!runtimeApiKey) throw new Error('API key required. Enter your Anthropic key in the Skill Finder.');
      const label = typeof params.label === 'string' ? params.label : 'skill';
      const pattern = typeof params.pattern === 'string' ? params.pattern : '';
      const occurrences = typeof params.occurrences === 'number' ? params.occurrences : 0;
      const skillSessions = typeof params.sessions === 'number' ? params.sessions : 0;
      const examples = Array.isArray(params.examples) ? params.examples as string[] : [];
      const skillDraft = typeof params.skillDraft === 'string' ? params.skillDraft : '';
      const { system: skSys, user: skUser } = buildSkillContentPrompt({
        label, pattern, occurrences, sessions: skillSessions, examples: examples.slice(0, 5), skillDraft,
      });
      const llm3 = createAnthropicClient({ apiKey: runtimeApiKey, directBrowserAccess: true });
      const text = await llm3.complete([{ role: 'user', content: skSys }, { role: 'user', content: skUser }]);
      const { content, filename } = parseSkillMarkdown(text, label);
      return { content, filename };
    }
    case 'installSkill': {
      // In file:// scan mode, disk writes are not possible — trigger a download instead.
      const filename = typeof params.filename === 'string' ? params.filename : 'skill.md';
      const content = typeof params.content === 'string' ? params.content : '';
      triggerDownload(filename.split('/').pop() ?? 'SKILL.md', content);
      return { ok: true, downloaded: true };
    }
    case 'installCatalogItem': {
      const content = typeof params.content === 'string' ? params.content : '';
      const title = typeof params.title === 'string' ? params.title : 'catalog-item';
      const slug = title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/-+/g, '-').replaceAll(/^-|-$/g, '');
      const filename = typeof params.path === 'string' ? (params.path.split('/').pop() ?? `${slug}.md`) : `${slug}.md`;
      triggerDownload(filename, content);
      return { ok: true, downloaded: true };
    }
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
