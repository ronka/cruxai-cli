/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Terminal-native Context Health view — the CLI counterpart to the webview's
 * Context Health page (src/webview/page-context-mgmt.ts). Reuses the same
 * Analyzer.getContextManagement() data, rendered as ANSI text instead of HTML. */

import { findLogsDirs, parseAllLogsAsyncDetailed } from '@crux/core/parser';
import { Analyzer } from '@crux/core/analyzer';
import type {
  DateFilter,
  ContextManagementData,
  ContextVerdictThresholds,
  WorkspaceContextScore,
  SessionContextDetail,
  WorkspaceContextSessionsData,
} from '@crux/core/types';
import {
  colorEnabled, color, bold, utilBar, sparkline, table,
  type ColorName, type Column,
} from '../render/term';

interface ContextHealthFlags {
  filter: DateFilter;
  workspace?: string;
  json: boolean;
  noColor: boolean;
}

function parseFlags(argv: string[]): ContextHealthFlags {
  const filter: DateFilter = {};
  let workspace: string | undefined;
  let json = false;
  let noColor = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--from' && argv[i + 1]) filter.fromDate = argv[++i];
    else if (a === '--to' && argv[i + 1]) filter.toDate = argv[++i];
    else if (a === '--workspace' && argv[i + 1]) { workspace = argv[++i]; filter.workspaceId = workspace; }
    else if (a === '--harness' && argv[i + 1]) filter.harness = argv[++i];
    else if (a === '--json') json = true;
    else if (a === '--no-color') noColor = true;
  }
  return { filter, workspace, json, noColor };
}

const VERDICT_COLOR: Record<string, ColorName> = {
  optimal: 'green',
  degraded: 'yellow',
  limited: 'red',
};

/** Zone color for a utilization percentage — mirrors page-context-mgmt contextColor(). */
function contextZone(utilization: number, t: ContextVerdictThresholds): ColorName {
  if (utilization >= t.limitedUtilization) return 'red';
  if (utilization >= t.optimalUtilization) return 'yellow';
  return 'green';
}

function scoreColor(score: number): ColorName {
  return score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';
}

function saturationColor(sat: number): ColorName {
  return sat > 30 ? 'red' : sat > 10 ? 'yellow' : 'green';
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(Math.round(n));
}

function sortWorkspacesBySessions(workspaces: WorkspaceContextScore[]): WorkspaceContextScore[] {
  return [...workspaces].sort((a, b) =>
    b.sessionCount - a.sessionCount
    || b.requestsWithTokens - a.requestsWithTokens
    || a.workspaceName.localeCompare(b.workspaceName)
  );
}

const WS_LIMIT = 20;

/** Build the full Context Health report as a string (pure — used by tests). */
export function renderContextHealth(
  data: ContextManagementData,
  sessionData: WorkspaceContextSessionsData | null,
  enabled: boolean,
): string {
  if (data.totalSessions === 0) return renderEmptyState(enabled);

  const sections = [
    renderSummary(data, enabled),
    renderInsights(data, enabled),
    renderTrend(data, enabled),
    renderWorkspaceTable(data, enabled),
  ];
  if (sessionData) sections.push(renderDrillDown(sessionData, enabled));

  return ['', sections.join('\n\n'), ''].join('\n');
}

function renderEmptyState(enabled: boolean): string {
  return [
    '',
    bold(enabled, '  No Session Data'),
    color(enabled, 'muted', '  No sessions found for the selected time period.'),
    color(enabled, 'muted', '  Adjust the date filter or use AI coding tools to generate data.'),
  ].join('\n');
}

function renderSummary(data: ContextManagementData, enabled: boolean): string {
  const sc = scoreColor(data.overallScore);
  const cc: ColorName = data.totalCompactions > 10 ? 'red' : data.totalCompactions > 0 ? 'yellow' : 'green';
  return `  ${color(enabled, 'muted', 'Context Score')}  ${bold(enabled, color(enabled, sc, `${data.overallScore}/100`))}`
    + `     ${color(enabled, 'muted', 'Compactions')}  ${bold(enabled, color(enabled, cc, String(data.totalCompactions)))}`
    + `     ${color(enabled, 'muted', 'Sessions')}  ${bold(enabled, String(data.totalSessions))}`;
}

function renderInsights(data: ContextManagementData, enabled: boolean): string {
  if (data.tips.length === 0) return '';
  return [
    bold(enabled, '  Insights'),
    ...data.tips.map(tip => `  ${color(enabled, 'blue', '•')} ${tip}`),
  ].join('\n');
}

function renderTrend(data: ContextManagementData, enabled: boolean): string {
  const lines = [
    bold(enabled, '  Context Utilization Trend'),
    color(enabled, 'muted', '  Weekly average context utilization (% of window) and compaction events.'),
  ];
  if (data.trend.length <= 1) {
    lines.push(color(enabled, 'muted', '  Not enough weekly data for trend.'));
    return lines.join('\n');
  }
  const utils = data.trend.map(t => t.avgUtilization);
  const peak = Math.max(...utils);
  lines.push(`  util  ${color(enabled, contextZone(peak, data.thresholds), sparkline(utils, 100))}  `
    + color(enabled, 'muted', `${utils[0].toFixed(0)}% → ${utils[utils.length - 1].toFixed(0)}% `)
    + color(enabled, 'yellow', `(degraded ${data.thresholds.optimalUtilization}% `)
    + color(enabled, 'red', `limited ${data.thresholds.limitedUtilization}%)`));
  const comps = data.trend.map(t => t.compactions);
  if (comps.some(c => c > 0)) {
    lines.push(`  comp  ${sparkline(comps)}  ${color(enabled, 'muted', `${comps.reduce((a, b) => a + b, 0)} total`)}`);
  }
  lines.push(color(enabled, 'muted', `  weeks ${data.trend[0].label} … ${data.trend[data.trend.length - 1].label}`));
  return lines.join('\n');
}

function renderWorkspaceTable(data: ContextManagementData, enabled: boolean): string {
  const header = bold(enabled, '  Per-Workspace Context Session Health');
  const sorted = sortWorkspacesBySessions(data.workspaces);
  if (sorted.length === 0) {
    return `${header}\n${color(enabled, 'muted', '  No workspaces with token data found.')}`;
  }
  const columns: Column[] = [
    { header: 'Workspace' },
    { header: 'Score', align: 'right' },
    { header: 'Verdict' },
    { header: 'AvgTok', align: 'right' },
    { header: 'Avg Util' },
    { header: 'Sat', align: 'right' },
    { header: 'Comp', align: 'right' },
    { header: 'Sess', align: 'right' },
  ];
  const rows = sorted.slice(0, WS_LIMIT).map(w => {
    const name = w.workspaceName.length > 28 ? w.workspaceName.slice(0, 27) + '…' : w.workspaceName;
    return [
      color(enabled, 'blue', name),
      bold(enabled, color(enabled, scoreColor(w.score), String(w.score))),
      color(enabled, VERDICT_COLOR[w.verdict] ?? 'muted', w.verdict),
      formatNum(w.avgPromptTokens),
      utilBar(enabled, w.avgUtilization, contextZone(w.avgUtilization, data.thresholds)),
      color(enabled, saturationColor(w.saturation), `${w.saturation.toFixed(0)}%`),
      w.compactionCount > 0 ? color(enabled, 'yellow', String(w.compactionCount)) : '0',
      String(w.sessionCount),
    ];
  });
  const out = [header, indent(table(enabled, columns, rows), 2)];
  if (sorted.length > WS_LIMIT) {
    out.push(color(enabled, 'muted', `  + ${sorted.length - WS_LIMIT} more workspace(s)`));
  }
  return out.join('\n');
}

function renderDrillDown(sessionData: WorkspaceContextSessionsData, enabled: boolean): string {
  const header = bold(enabled, `  Sessions — ${sessionData.workspaceName}`);
  if (sessionData.sessions.length === 0) {
    return `${header}\n${color(enabled, 'muted', '  No sessions with token data for this workspace.')}`;
  }
  return `${header}\n${indent(renderSessionTable(sessionData, enabled), 2)}`;
}

function renderSessionTable(data: WorkspaceContextSessionsData, enabled: boolean): string {
  const columns: Column[] = [
    { header: 'Date' },
    { header: 'Harness' },
    { header: 'Verdict' },
    { header: 'Reqs', align: 'right' },
    { header: 'AvgTok', align: 'right' },
    { header: 'Avg Util' },
    { header: 'Sat', align: 'right' },
    { header: 'Events' },
    { header: 'Token Curve' },
  ];
  const rows = data.sessions.map((s: SessionContextDetail) => {
    const comp = s.events.filter(e => e.type === 'compaction').length;
    const todo = s.events.filter(e => e.type === 'todo-add' || e.type === 'todo-complete').length;
    const events = [
      comp > 0 ? color(enabled, 'yellow', `${comp}C`) : '',
      todo > 0 ? color(enabled, 'blue', `${todo}T`) : '',
    ].filter(Boolean).join(' ') || color(enabled, 'muted', '-');
    if (!s.hasPerRequestTokens) {
      return [
        s.date,
        s.harness,
        color(enabled, VERDICT_COLOR[s.verdict] ?? 'muted', s.verdict),
        String(s.requestCount),
        color(enabled, 'muted', '—'),
        color(enabled, 'muted', '—'),
        color(enabled, 'muted', '—'),
        events,
        color(enabled, 'muted', '—'),
      ];
    }
    const ctxWindow = s.contextWindow || data.estimatedContextWindow || 1;
    const utilCurve = s.tokenCurve.map(t => (t == null ? null : (t / ctxWindow) * 100));
    return [
      s.date,
      s.harness,
      color(enabled, VERDICT_COLOR[s.verdict] ?? 'muted', s.verdict),
      String(s.requestCount),
      formatNum(s.avgPromptTokens),
      utilBar(enabled, s.avgUtilization, contextZone(s.avgUtilization, data.thresholds)),
      color(enabled, saturationColor(s.saturation), `${s.saturation.toFixed(0)}%`),
      events,
      color(enabled, contextZone(s.peakUtilization, data.thresholds), sparkline(utilCurve, 100)),
    ];
  });
  return table(enabled, columns, rows);
}

function indent(block: string, spaces: number): string {
  const prefix = ' '.repeat(spaces);
  return block.split('\n').map(l => prefix + l).join('\n');
}

/** Spin indicator for the terminal (matches scan's). */
function makeSpinner(): { stop: () => void } {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const id = setInterval(() => {
    process.stderr.write(`\r${frames[i++ % frames.length]} Scanning...`);
  }, 80);
  return { stop: () => { clearInterval(id); process.stderr.write('\r'); } };
}

export async function runContextHealth(argv: string[]): Promise<void> {
  const flags = parseFlags(argv);

  const logsDirs = findLogsDirs();
  if (logsDirs.length === 0) {
    console.error('No AI session log directories found. Have you used Claude Code or VS Code Copilot?');
    process.exit(1);
  }

  const spinner = makeSpinner();
  const { result } = await parseAllLogsAsyncDetailed(logsDirs, (progress) => {
    if (progress.detail) process.stderr.write(`\r  ${progress.detail}                    `);
  });
  spinner.stop();

  const analyzer = new Analyzer(result.sessions, result.editLocIndex, result.workspaces);
  const data = analyzer.getContextManagement(flags.filter);

  const sessionData = flags.workspace
    ? analyzer.getWorkspaceContextSessions(flags.workspace, flags.filter)
    : null;

  if (flags.json) {
    process.stdout.write(JSON.stringify(sessionData ? { ...data, sessionDetail: sessionData } : data, null, 2) + '\n');
    return;
  }

  const enabled = colorEnabled(flags.noColor ? false : undefined);
  process.stdout.write(renderContextHealth(data, sessionData, enabled) + '\n');
}
