/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Terminal-native dashboard view — reads the already-written crux-report/data.json
 * from the last scan (or re-parses logs if absent) and renders sections as ANSI text. */

import * as fs from 'fs';
import * as path from 'path';
import { findLogsDirs, parseAllLogsAsyncDetailed } from '@crux/core/parser';
import { Analyzer } from '@crux/core/analyzer';
import type {
  DateFilter,
  StatsResult,
  DailyActivity,
  WorkspaceBreakdown,
  HourlyDistribution,
  Workspace,
  AntiPatternData,
  RecommendationResult,
  FlowStateData,
  AiCreditData,
  ConsumptionData,
  CodeProductionData,
} from '@crux/core/types';
import type { ParseResult } from '@crux/core/cache';
import {
  colorEnabled, color, bold, utilBar, sparkline,
} from '../render/term';
import { renderContextHealth } from './context-health';

interface ViewFlags {
  section: string;
  report: string;
  filter: DateFilter;
  json: boolean;
  noColor: boolean;
}

function parseFlags(argv: string[]): ViewFlags {
  const filter: DateFilter = {};
  let report = './crux-report';
  let json = false;
  let noColor = false;
  let section = 'overview';

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--report' && argv[i + 1]) report = argv[++i];
    else if (a === '--from' && argv[i + 1]) filter.fromDate = argv[++i];
    else if (a === '--to' && argv[i + 1]) filter.toDate = argv[++i];
    else if (a === '--workspace' && argv[i + 1]) filter.workspaceId = argv[++i];
    else if (a === '--harness' && argv[i + 1]) filter.harness = argv[++i];
    else if (a === '--json') json = true;
    else if (a === '--no-color') noColor = true;
    else if (!a.startsWith('--')) section = a;
  }

  return { section, report, filter, json, noColor };
}

/** Wire format for data.json — same shape as scan.ts serializeParseResult output. */
interface DataJson {
  sessions: ParseResult['sessions'];
  editLocIndex: [string, [string, number][]][];
  workspaces: [string, Workspace][];
}

function deserializeDataJson(raw: DataJson): ParseResult {
  const workspaces = new Map<string, Workspace>(raw.workspaces);
  const editLocIndex = new Map<string, Map<string, number>>();
  for (const [k, v] of raw.editLocIndex) {
    editLocIndex.set(k, new Map(v));
  }
  return { workspaces, sessions: raw.sessions, editLocIndex, sessionSourceIndex: new Map() };
}

/** Load ParseResult from a previously-written report directory's data.json.
 *  Returns null when the file is absent or unreadable. */
export function loadReport(reportDir: string): ParseResult | null {
  const dataPath = path.join(reportDir, 'data.json');
  try {
    const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as DataJson;
    return deserializeDataJson(raw);
  } catch {
    return null;
  }
}

function makeSpinner(): { stop: () => void } {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const id = setInterval(() => {
    process.stderr.write(`\r${frames[i++ % frames.length]} Scanning...`);
  }, 80);
  return { stop: () => { clearInterval(id); process.stderr.write('\r'); } };
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(Math.round(n));
}

/** Render the Overview section as a string (pure — used by tests). */
export function renderOverview(
  stats: StatsResult,
  daily: DailyActivity,
  harness: { labels: string[]; sessions: number[]; requests: number[] },
  workspaces: WorkspaceBreakdown,
  hourly: HourlyDistribution,
  enabled: boolean,
): string {
  const sections: string[] = [''];

  // Totals line
  sections.push(
    `  ${color(enabled, 'muted', 'Sessions')}   ${bold(enabled, fmt(stats.totalSessions))}`
    + `     ${color(enabled, 'muted', 'Requests')}   ${bold(enabled, fmt(stats.totalRequests))}`
    + `     ${color(enabled, 'muted', 'Workspaces')}  ${bold(enabled, fmt(stats.totalWorkspaces))}`
    + `     ${color(enabled, 'muted', 'Harnesses')}  ${bold(enabled, fmt(harness.labels.length))}`,
  );

  // Daily activity sparklines
  if (daily.labels.length > 1) {
    const maxReqs = Math.max(...daily.values, 1);
    const maxLoc = Math.max(...daily.loc, 1);
    sections.push('');
    sections.push(bold(enabled, '  Daily Activity'));
    sections.push(
      `  reqs  ${color(enabled, 'blue', sparkline(daily.values, maxReqs))}`
      + `  ${color(enabled, 'muted', `${daily.labels[0]} → ${daily.labels[daily.labels.length - 1]}`)}`,
    );
    if (daily.loc.some(v => v > 0)) {
      sections.push(`  loc   ${color(enabled, 'green', sparkline(daily.loc, maxLoc))}`);
    }
  }

  // Harness breakdown bars
  if (harness.labels.length > 0) {
    sections.push('');
    sections.push(bold(enabled, '  Harness Breakdown'));
    const maxReqs = Math.max(...harness.requests, 1);
    for (let i = 0; i < harness.labels.length; i++) {
      const pct = (harness.requests[i] / maxReqs) * 100;
      const label = harness.labels[i].length > 12 ? harness.labels[i].slice(0, 11) + '…' : harness.labels[i].padEnd(12);
      sections.push(
        `  ${color(enabled, 'blue', label)}  ${utilBar(enabled, pct, 'blue')}`
        + `  ${color(enabled, 'muted', fmt(harness.requests[i]) + ' req')}`,
      );
    }
  }

  // Top workspaces bars
  const topWs = workspaces.labels.slice(0, 10);
  const topVals = workspaces.values.slice(0, 10);
  if (topWs.length > 0) {
    sections.push('');
    sections.push(bold(enabled, '  Top Workspaces'));
    const maxVal = Math.max(...topVals, 1);
    for (let i = 0; i < topWs.length; i++) {
      const pct = (topVals[i] / maxVal) * 100;
      const name = topWs[i].length > 24 ? topWs[i].slice(0, 23) + '…' : topWs[i];
      const label = name.padEnd(24);
      sections.push(
        `  ${color(enabled, 'muted', label)}  ${utilBar(enabled, pct, 'purple')}`
        + `  ${color(enabled, 'muted', fmt(topVals[i]))}`,
      );
    }
  }

  // Hourly activity sparkline
  if (hourly.hours.some(v => v > 0)) {
    sections.push('');
    sections.push(bold(enabled, '  Hourly Activity'));
    const maxH = Math.max(...hourly.hours, 1);
    sections.push(`  ${color(enabled, 'yellow', sparkline(hourly.hours, maxH))}  ${color(enabled, 'muted', '0h → 23h')}`);
  }

  sections.push('');
  return sections.join('\n');
}

const FLOW_LABEL_COLOR = { deep: 'green', moderate: 'blue', shallow: 'yellow', fragmented: 'red' } as const;
const SEVERITY_COLOR = { high: 'red', medium: 'yellow', low: 'muted' } as const;
const STATUS_COLOR = { critical: 'red', 'needs-improvement': 'yellow', good: 'green' } as const;

/** Render the Patterns section as a string (pure — used by tests). */
export function renderPatterns(
  data: AntiPatternData,
  recommendations: RecommendationResult[],
  enabled: boolean,
): string {
  const sections: string[] = [''];

  // Anti-patterns
  sections.push(bold(enabled, '  Anti-Patterns'));
  if (data.patterns.length === 0) {
    sections.push(color(enabled, 'green', '  No anti-patterns detected.'));
  } else {
    sections.push(
      color(enabled, 'muted', `  ${data.patterns.length} pattern(s) detected, ${data.totalOccurrences} total occurrence(s).`),
    );
    sections.push('');
    const sorted = [...data.patterns].sort((a, b) => {
      const sv = { high: 0, medium: 1, low: 2 };
      return (sv[a.severity] - sv[b.severity]) || b.occurrences - a.occurrences;
    });
    for (const p of sorted) {
      const sev = color(enabled, SEVERITY_COLOR[p.severity] ?? 'muted', p.severity.toUpperCase().padEnd(6));
      const trend = p.weeklyHist.counts.length > 1 ? ` ${sparkline(p.weeklyHist.counts)}` : '';
      sections.push(`  ${sev}  ${bold(enabled, p.name)}  ${color(enabled, 'muted', `(${p.occurrences}×)`)}${trend}`);
      sections.push(`         ${color(enabled, 'muted', p.suggestion)}`);
    }
  }

  // Recommendations
  if (recommendations.length > 0) {
    sections.push('');
    sections.push(bold(enabled, '  Recommendations'));
    const sorted = [...recommendations].sort((a, b) => {
      const sv = { critical: 0, 'needs-improvement': 1, good: 2 };
      return (sv[a.status] - sv[b.status]) || a.score - b.score;
    });
    for (const r of sorted) {
      const statusCol = STATUS_COLOR[r.status] ?? 'muted';
      const score = color(enabled, statusCol, `${r.score}/100`);
      sections.push(`  ${score}  ${bold(enabled, r.name)}`);
      sections.push(`         ${color(enabled, 'muted', r.finding)}`);
      sections.push(`         ${color(enabled, 'blue', r.recommendation)}`);
    }
  }

  sections.push('');
  return sections.join('\n');
}

/** Render the Production section as a string (pure — used by tests). */
export function renderProduction(data: CodeProductionData, enabled: boolean): string {
  const { summary } = data;
  const sections: string[] = [''];

  if (summary.totalLoc === 0) {
    sections.push(bold(enabled, '  No Code Production Data'));
    sections.push(color(enabled, 'muted', '  No LOC data found for the selected period.'));
    sections.push('');
    return sections.join('\n');
  }

  // Summary totals
  const aiPct = (summary.aiRatio * 100).toFixed(1);
  sections.push(
    `  ${color(enabled, 'muted', 'Total LOC')}  ${bold(enabled, fmt(summary.totalLoc))}`
    + `     ${color(enabled, 'green', 'AI LOC')}  ${bold(enabled, fmt(summary.totalAiLoc))}`
    + `     ${color(enabled, 'blue', 'User LOC')}  ${bold(enabled, fmt(summary.totalUserLoc))}`
    + `     ${color(enabled, 'muted', 'AI ratio')}  ${bold(enabled, aiPct + '%')}`,
  );

  // AI vs User bar
  const aiBar = utilBar(enabled, summary.aiRatio * 100, summary.aiRatio > 0.5 ? 'green' : 'blue');
  sections.push(`  AI contribution  ${aiBar}`);

  // By language
  if (data.byLanguage.labels.length > 0) {
    sections.push('');
    sections.push(bold(enabled, '  By Language'));
    const maxLoc = Math.max(...data.byLanguage.aiLoc.map((a, i) => a + data.byLanguage.userLoc[i]), 1);
    for (let i = 0; i < Math.min(data.byLanguage.labels.length, 8); i++) {
      const total = data.byLanguage.aiLoc[i] + data.byLanguage.userLoc[i];
      const pct = (total / maxLoc) * 100;
      const lang = data.byLanguage.labels[i].length > 14 ? data.byLanguage.labels[i].slice(0, 13) + '…' : data.byLanguage.labels[i].padEnd(14);
      sections.push(
        `  ${color(enabled, 'muted', lang)}  ${utilBar(enabled, pct, 'green')}`
        + `  ${color(enabled, 'muted', `${fmt(total)} loc (AI: ${fmt(data.byLanguage.aiLoc[i])})`)}`,
      );
    }
  }

  // Daily timeline sparklines
  if (data.dailyTimeline.labels.length > 1) {
    const maxAi = Math.max(...data.dailyTimeline.aiLoc, 1);
    const maxUser = Math.max(...data.dailyTimeline.userLoc, 1);
    sections.push('');
    sections.push(bold(enabled, '  Daily Timeline'));
    sections.push(
      `  AI    ${color(enabled, 'green', sparkline(data.dailyTimeline.aiLoc, maxAi))}`
      + `  ${color(enabled, 'muted', `${data.dailyTimeline.labels[0]} → ${data.dailyTimeline.labels[data.dailyTimeline.labels.length - 1]}`)}`,
    );
    sections.push(`  User  ${color(enabled, 'blue', sparkline(data.dailyTimeline.userLoc, maxUser))}`);
  }

  sections.push('');
  return sections.join('\n');
}

/** Render the Credits section as a string (pure — used by tests). */
export function renderCredits(credits: AiCreditData, consumption: ConsumptionData, enabled: boolean): string {
  const sections: string[] = [''];

  // Summary totals
  const creds = credits.totalCredits.toFixed(2);
  const inp = fmt(credits.totalInputTokens);
  const out = fmt(credits.totalOutputTokens);
  sections.push(
    `  ${color(enabled, 'muted', 'Credits')}  ${bold(enabled, creds)}`
    + `     ${color(enabled, 'muted', 'Input Tokens')}  ${bold(enabled, inp)}`
    + `     ${color(enabled, 'muted', 'Output Tokens')}  ${bold(enabled, out)}`
    + `     ${color(enabled, 'muted', 'Requests')}  ${bold(enabled, fmt(credits.totalRequests))}`,
  );

  // Avg per day/request
  sections.push(
    `  ${color(enabled, 'muted', 'Avg/day')}  ${bold(enabled, credits.avgCreditsPerDay.toFixed(2))}`
    + `     ${color(enabled, 'muted', 'Avg/req')}   ${bold(enabled, credits.avgCreditsPerRequest.toFixed(4))}`,
  );

  // Daily credits sparkline
  if (credits.daily.labels.length > 1) {
    const maxC = Math.max(...credits.daily.credits, 1);
    sections.push('');
    sections.push(bold(enabled, '  Daily Credits'));
    sections.push(
      `  ${color(enabled, 'purple', sparkline(credits.daily.credits, maxC))}`
      + `  ${color(enabled, 'muted', `${credits.daily.labels[0]} → ${credits.daily.labels[credits.daily.labels.length - 1]}`)}`,
    );
  }

  // Per-model breakdown
  const models = Object.entries(credits.costByModel).sort((a, b) => b[1].credits - a[1].credits);
  if (models.length > 0) {
    sections.push('');
    sections.push(bold(enabled, '  Per-Model Usage'));
    const maxCred = Math.max(...models.map(([, m]) => m.credits), 1);
    for (const [model, m] of models.slice(0, 8)) {
      const pct = (m.credits / maxCred) * 100;
      const label = model.length > 24 ? model.slice(0, 23) + '…' : model.padEnd(24);
      sections.push(
        `  ${color(enabled, 'blue', label)}  ${utilBar(enabled, pct, 'purple')}`
        + `  ${color(enabled, 'muted', `${m.credits.toFixed(2)} cr  ${fmt(m.requests)} req`)}`,
      );
    }
  }

  // Avg requests per day/week from consumption
  sections.push('');
  sections.push(
    `  ${color(enabled, 'muted', 'Req/day avg')}   ${bold(enabled, consumption.avgPerDay.toFixed(1))}`
    + `     ${color(enabled, 'muted', 'Req/week avg')}  ${bold(enabled, consumption.avgPerWeek.toFixed(1))}`,
  );

  sections.push('');
  return sections.join('\n');
}

/** Render the Flow section as a string (pure — used by tests). */
export function renderFlow(data: FlowStateData, enabled: boolean): string {
  const sections: string[] = [''];

  if (data.totalDays === 0) {
    sections.push(bold(enabled, '  No Flow Data'));
    sections.push(color(enabled, 'muted', '  No sessions found for the selected time period.'));
    sections.push('');
    return sections.join('\n');
  }

  // Summary
  const flowColor = data.overallFlowScore >= 70 ? 'green' : data.overallFlowScore >= 40 ? 'yellow' : 'red';
  sections.push(
    `  ${color(enabled, 'muted', 'Flow Score')}  ${bold(enabled, color(enabled, flowColor, `${data.overallFlowScore}/100`))}`
    + `     ${color(enabled, 'muted', 'Deep-flow Days')}  ${bold(enabled, `${data.deepFlowDays}/${data.totalDays}`)}`
    + `     ${color(enabled, 'muted', 'Avg Follow-up')}  ${bold(enabled, `${Math.round(data.avgFollowUpSec)}s`)}`
    + `     ${color(enabled, 'muted', 'Avg Block')}  ${bold(enabled, `${Math.round(data.avgBlockMin)}m`)}`,
  );

  // Weekly trend sparkline
  if (data.weeklyTrend.scores.length > 1) {
    sections.push('');
    sections.push(bold(enabled, '  Weekly Flow Trend'));
    sections.push(
      `  ${color(enabled, flowColor, sparkline(data.weeklyTrend.scores, 100))}`
      + `  ${color(enabled, 'muted', `${data.weeklyTrend.labels[0]} → ${data.weeklyTrend.labels[data.weeklyTrend.labels.length - 1]}`)}`,
    );
  }

  // Hourly flow distribution
  if (data.hourlyFlow.some(v => v > 0)) {
    sections.push('');
    sections.push(bold(enabled, '  Best Hours for Deep Work'));
    const maxF = Math.max(...data.hourlyFlow, 1);
    sections.push(`  ${color(enabled, 'green', sparkline(data.hourlyFlow, maxF))}  ${color(enabled, 'muted', '0h → 23h')}`);
  }

  // Day breakdown (most recent 10)
  if (data.days.length > 0) {
    sections.push('');
    sections.push(bold(enabled, '  Recent Days'));
    const recent = [...data.days].reverse().slice(0, 10);
    for (const d of recent) {
      const lc = FLOW_LABEL_COLOR[d.flowLabel] ?? 'muted';
      const label = color(enabled, lc, d.flowLabel.padEnd(10));
      sections.push(
        `  ${color(enabled, 'muted', d.date)}  ${label}`
        + `  ${color(enabled, 'muted', `score ${bold(enabled, String(Math.round(d.avgFlowScore)))}  ${d.sessions.length} session(s)`)}`,
      );
    }
  }

  // Suggestions
  if (data.suggestions.length > 0) {
    sections.push('');
    sections.push(bold(enabled, '  Suggestions'));
    for (const s of data.suggestions) {
      sections.push(`  ${color(enabled, 'blue', '•')} ${s}`);
    }
  }

  sections.push('');
  return sections.join('\n');
}

export async function runView(argv: string[]): Promise<void> {
  const flags = parseFlags(argv);

  let result = loadReport(path.resolve(flags.report));

  if (!result) {
    const logsDirs = findLogsDirs();
    if (logsDirs.length === 0) {
      console.error(
        `No report found at ${flags.report} and no AI session log directories found.`
        + '\nRun `crux scan` first, or use AI coding tools to generate session data.',
      );
      process.exit(1);
    }
    const spinner = makeSpinner();
    const parsed = await parseAllLogsAsyncDetailed(logsDirs, (progress) => {
      if (progress.detail) process.stderr.write(`\r  ${progress.detail}                    `);
    });
    spinner.stop();
    result = parsed.result;
  }

  const analyzer = new Analyzer(result.sessions, result.editLocIndex, result.workspaces);
  const enabled = colorEnabled(flags.noColor ? false : undefined);

  switch (flags.section) {
    case 'overview': {
      const stats = analyzer.getStats(flags.filter);
      const daily = analyzer.getDailyActivity(flags.filter);
      const harness = analyzer.getHarnessBreakdown(flags.filter);
      const ws = analyzer.getWorkspaceBreakdown(flags.filter);
      const hourly = analyzer.getHourlyDistribution(flags.filter);
      if (flags.json) {
        process.stdout.write(JSON.stringify({ stats, daily, harness, workspaces: ws, hourly }, null, 2) + '\n');
        return;
      }
      process.stdout.write(renderOverview(stats, daily, harness, ws, hourly, enabled) + '\n');
      break;
    }
    case 'context': {
      const data = analyzer.getContextManagement(flags.filter);
      const sessionData = flags.filter.workspaceId
        ? analyzer.getWorkspaceContextSessions(flags.filter.workspaceId, flags.filter)
        : null;
      if (flags.json) {
        process.stdout.write(JSON.stringify(sessionData ? { ...data, sessionDetail: sessionData } : data, null, 2) + '\n');
        return;
      }
      process.stdout.write(renderContextHealth(data, sessionData, enabled) + '\n');
      break;
    }
    case 'patterns': {
      const data = analyzer.getAntiPatterns(flags.filter);
      const recs = analyzer.getRecommendations(flags.filter);
      if (flags.json) {
        process.stdout.write(JSON.stringify({ antiPatterns: data, recommendations: recs }, null, 2) + '\n');
        return;
      }
      process.stdout.write(renderPatterns(data, recs, enabled) + '\n');
      break;
    }
    case 'flow': {
      const data = analyzer.getFlowState(flags.filter);
      if (flags.json) {
        process.stdout.write(JSON.stringify(data, null, 2) + '\n');
        return;
      }
      process.stdout.write(renderFlow(data, enabled) + '\n');
      break;
    }
    case 'credits': {
      const credits = analyzer.getAiCredits(flags.filter);
      const consumption = analyzer.getConsumption(flags.filter);
      if (flags.json) {
        process.stdout.write(JSON.stringify({ credits, consumption }, null, 2) + '\n');
        return;
      }
      process.stdout.write(renderCredits(credits, consumption, enabled) + '\n');
      break;
    }
    case 'production': {
      const data = analyzer.getCodeProduction(flags.filter);
      if (flags.json) {
        process.stdout.write(JSON.stringify(data, null, 2) + '\n');
        return;
      }
      process.stdout.write(renderProduction(data, enabled) + '\n');
      break;
    }
    case 'all': {
      const stats = analyzer.getStats(flags.filter);
      const daily = analyzer.getDailyActivity(flags.filter);
      const harness = analyzer.getHarnessBreakdown(flags.filter);
      const ws = analyzer.getWorkspaceBreakdown(flags.filter);
      const hourly = analyzer.getHourlyDistribution(flags.filter);
      const ctxData = analyzer.getContextManagement(flags.filter);
      const patternsData = analyzer.getAntiPatterns(flags.filter);
      const recs = analyzer.getRecommendations(flags.filter);
      const flowData = analyzer.getFlowState(flags.filter);
      const creditsData = analyzer.getAiCredits(flags.filter);
      const consumption = analyzer.getConsumption(flags.filter);
      const prodData = analyzer.getCodeProduction(flags.filter);

      if (flags.json) {
        process.stdout.write(JSON.stringify({
          overview: { stats, daily, harness, workspaces: ws, hourly },
          context: ctxData,
          patterns: { antiPatterns: patternsData, recommendations: recs },
          flow: flowData,
          credits: { credits: creditsData, consumption },
          production: prodData,
        }, null, 2) + '\n');
        return;
      }

      const sep = (title: string): string =>
        '\n' + color(enabled, 'muted', '  ' + '─'.repeat(60)) + '\n'
        + bold(enabled, `  ▶ ${title}`) + '\n';

      process.stdout.write(
        sep('Overview') + renderOverview(stats, daily, harness, ws, hourly, enabled)
        + sep('Context Health') + renderContextHealth(ctxData, null, enabled)
        + sep('Patterns') + renderPatterns(patternsData, recs, enabled)
        + sep('Flow') + renderFlow(flowData, enabled)
        + sep('Credits') + renderCredits(creditsData, consumption, enabled)
        + sep('Production') + renderProduction(prodData, enabled)
        + '\n',
      );
      break;
    }
    default:
      console.error(`Unknown section: ${flags.section}. Available: overview, context, patterns, flow, credits, production, all`);
      process.exit(1);
  }
}
