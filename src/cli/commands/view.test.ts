/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { renderOverview, renderPatterns, renderFlow, renderCredits, renderProduction } from './view';
import { renderContextHealth } from './context-health';
import type {
  StatsResult, DailyActivity, WorkspaceBreakdown, HourlyDistribution,
  ContextManagementData, ContextVerdictThresholds,
  AntiPatternData, RecommendationResult, FlowStateData,
  AiCreditData, ConsumptionData, CodeProductionData,
} from '../../core/types';

const stats: StatsResult = { totalSessions: 42, totalWorkspaces: 3, totalRequests: 1_500 };

const daily: DailyActivity = {
  labels: ['2025-01-01', '2025-01-07'],
  values: [10, 20],
  loc: [100, 200],
  sessions: [1, 2],
  workspaces: [1, 1],
  byHarness: [],
};

const harness = {
  labels: ['claude', 'copilot'],
  sessions: [30, 12],
  requests: [1000, 500],
};

const workspaces: WorkspaceBreakdown = {
  labels: ['my-project', 'another-project'],
  values: [900, 600],
};

const hourly: HourlyDistribution = {
  hours: [...Array(24).keys()].map(h => (h >= 9 && h < 18 ? 10 : 0)),
  byType: {},
};

describe('renderOverview', () => {
  it('renders totals line with sessions, requests, workspaces, harnesses', () => {
    const out = renderOverview(stats, daily, harness, workspaces, hourly, false);
    expect(out).toContain('42');
    expect(out).toContain('1.5k');
    expect(out).toContain('3');
    expect(out).toContain('Sessions');
    expect(out).toContain('Requests');
    expect(out).toContain('Workspaces');
    expect(out).toContain('Harnesses');
  });

  it('renders daily activity sparklines', () => {
    const out = renderOverview(stats, daily, harness, workspaces, hourly, false);
    expect(out).toContain('Daily Activity');
    expect(out).toContain('reqs');
    expect(out).toContain('loc');
    expect(out).toContain('2025-01-01');
    expect(out).toContain('2025-01-07');
  });

  it('renders harness breakdown bars', () => {
    const out = renderOverview(stats, daily, harness, workspaces, hourly, false);
    expect(out).toContain('Harness Breakdown');
    expect(out).toContain('claude');
    expect(out).toContain('copilot');
  });

  it('renders top workspaces bars', () => {
    const out = renderOverview(stats, daily, harness, workspaces, hourly, false);
    expect(out).toContain('Top Workspaces');
    expect(out).toContain('my-project');
    expect(out).toContain('another-project');
  });

  it('renders hourly activity sparkline', () => {
    const out = renderOverview(stats, daily, harness, workspaces, hourly, false);
    expect(out).toContain('Hourly Activity');
    expect(out).toContain('0h → 23h');
  });

  it('suppresses daily activity when only one label', () => {
    const singleDay: DailyActivity = { ...daily, labels: ['2025-01-01'], values: [5], loc: [50], sessions: [1], workspaces: [1] };
    const out = renderOverview(stats, singleDay, harness, workspaces, hourly, false);
    expect(out).not.toContain('Daily Activity');
  });

  it('suppresses loc sparkline when all loc values are zero', () => {
    const noLoc: DailyActivity = { ...daily, loc: [0, 0] };
    const out = renderOverview(stats, noLoc, harness, workspaces, hourly, false);
    expect(out).not.toContain('loc');
  });

  it('suppresses hourly section when all hours are zero', () => {
    const noHourly: HourlyDistribution = { hours: new Array(24).fill(0), byType: {} };
    const out = renderOverview(stats, daily, harness, workspaces, noHourly, false);
    expect(out).not.toContain('Hourly Activity');
  });

  it('truncates long workspace names', () => {
    const longName = 'a'.repeat(40);
    const ws: WorkspaceBreakdown = { labels: [longName], values: [100] };
    const out = renderOverview(stats, daily, harness, ws, hourly, false);
    expect(out).toContain('…');
    expect(out).not.toContain(longName);
  });

  it('emits ANSI codes when color is enabled', () => {
    const out = renderOverview(stats, daily, harness, workspaces, hourly, true);
    // eslint-disable-next-line no-control-regex
    expect(out).toMatch(/\[/);
  });

  it('emits no ANSI codes when color is disabled', () => {
    const out = renderOverview(stats, daily, harness, workspaces, hourly, false);
    // eslint-disable-next-line no-control-regex
    expect(out).not.toMatch(/\x1b\[/);
  });
});

describe('renderPatterns', () => {
  const emptyPatterns: AntiPatternData = {
    patterns: [],
    totalOccurrences: 0,
    weeklyTrend: { labels: [], counts: [] },
    groupScores: [],
    weeklyScores: { labels: [], series: [] },
  };

  const recs: RecommendationResult[] = [
    {
      checkId: 'r1',
      name: 'Write atomic commits',
      category: 'code-review',
      score: 40,
      status: 'needs-improvement',
      finding: 'Large commits detected.',
      recommendation: 'Break work into smaller commits.',
    },
  ];

  it('shows no-patterns message when empty', () => {
    const out = renderPatterns(emptyPatterns, [], false);
    expect(out).toContain('No anti-patterns detected');
  });

  it('renders detected patterns with severity and suggestion', () => {
    const data: AntiPatternData = {
      ...emptyPatterns,
      patterns: [{
        id: 'p1',
        name: 'Long sessions',
        severity: 'high',
        group: 'session-hygiene',
        occurrences: 5,
        description: 'Sessions are too long.',
        suggestion: 'Keep sessions under 30 minutes.',
        examples: [],
        details: [],
        weeklyHist: { labels: ['W1', 'W2'], counts: [2, 3] },
      }],
      totalOccurrences: 5,
    };
    const out = renderPatterns(data, [], false);
    expect(out).toContain('Anti-Patterns');
    expect(out).toContain('Long sessions');
    expect(out).toContain('HIGH');
    expect(out).toContain('(5×)');
    expect(out).toContain('Keep sessions under 30 minutes.');
  });

  it('renders recommendations with finding and advice', () => {
    const out = renderPatterns(emptyPatterns, recs, false);
    expect(out).toContain('Recommendations');
    expect(out).toContain('Write atomic commits');
    expect(out).toContain('Large commits detected.');
    expect(out).toContain('Break work into smaller commits.');
  });

  it('sorts patterns: high before medium before low', () => {
    const data: AntiPatternData = {
      ...emptyPatterns,
      patterns: [
        { id: 'l', name: 'Low', severity: 'low', group: 'session-hygiene', occurrences: 1, description: '', suggestion: 'Fix low', examples: [], details: [], weeklyHist: { labels: [], counts: [] } },
        { id: 'h', name: 'High', severity: 'high', group: 'session-hygiene', occurrences: 3, description: '', suggestion: 'Fix high', examples: [], details: [], weeklyHist: { labels: [], counts: [] } },
      ],
      totalOccurrences: 4,
    };
    const out = renderPatterns(data, [], false);
    const highIdx = out.indexOf('High');
    const lowIdx = out.indexOf('Low');
    expect(highIdx).toBeLessThan(lowIdx);
  });
});

describe('renderFlow', () => {
  const emptyFlow: FlowStateData = {
    days: [],
    overallFlowScore: 0,
    avgFollowUpSec: 0,
    avgBlockMin: 0,
    deepFlowDays: 0,
    totalDays: 0,
    weeklyTrend: { labels: [], scores: [] },
    hourlyFlow: new Array(24).fill(0),
    suggestions: [],
  };

  it('shows empty state when no days', () => {
    const out = renderFlow(emptyFlow, false);
    expect(out).toContain('No Flow Data');
  });

  it('renders flow score, deep days, follow-up and block stats', () => {
    const data: FlowStateData = {
      ...emptyFlow,
      overallFlowScore: 75,
      deepFlowDays: 4,
      totalDays: 10,
      avgFollowUpSec: 45,
      avgBlockMin: 22,
      days: [{
        date: '2025-06-01',
        longestBlockMin: 60,
        totalHours: 3,
        blockCount: 2,
        avgFlowScore: 80,
        flowLabel: 'deep',
        sessions: [],
      }],
      weeklyTrend: { labels: ['W1', 'W2'], scores: [60, 75] },
      hourlyFlow: [...new Array(9).fill(0), ...new Array(9).fill(70), ...new Array(6).fill(0)],
      suggestions: ['Reduce interruptions during morning hours.'],
    };
    const out = renderFlow(data, false);
    expect(out).toContain('75/100');
    expect(out).toContain('4/10');
    expect(out).toContain('45s');
    expect(out).toContain('22m');
    expect(out).toContain('Weekly Flow Trend');
    expect(out).toContain('Best Hours for Deep Work');
    expect(out).toContain('Recent Days');
    expect(out).toContain('2025-06-01');
    expect(out).toContain('deep');
    expect(out).toContain('Suggestions');
    expect(out).toContain('Reduce interruptions');
  });
});

describe('renderCredits', () => {
  const baseCredits: AiCreditData = {
    totalCredits: 12.5,
    totalInputTokens: 500_000,
    totalOutputTokens: 80_000,
    totalCacheReadTokens: 100_000,
    totalCacheWriteTokens: 50_000,
    totalRequests: 200,
    countedRequests: 190,
    partialRequests: 5,
    pendingRequests: 3,
    noDataRequests: 2,
    delegatedRequests: 0,
    finalizableRequests: 195,
    missingPct: 0,
    avgCreditsPerRequest: 0.0625,
    avgCreditsPerDay: 1.25,
    costByModel: {
      'claude-sonnet': {
        requests: 150, countedRequests: 145, partialRequests: 3, pendingRequests: 2,
        noDataRequests: 0, delegatedRequests: 0, uncachedInputTokens: 300_000,
        inputTokens: 400_000, outputTokens: 60_000, cacheReadTokens: 100_000,
        cacheWriteTokens: 50_000, credits: 10.0, missingPct: 0, finalizableRequests: 148,
        harnesses: ['claude'],
      },
    },
    daily: { labels: ['2025-01-01', '2025-01-02'], credits: [5, 7.5], cumulative: [5, 12.5], byModel: {} },
    weekly: { labels: [], credits: [], cumulative: [], byModel: {} },
    dailyTokensByWorkspace: { labels: [], byWorkspace: {} },
    dailyTokensByHarness: { labels: [], byHarness: {} },
    topRequests: [],
  };

  const baseConsumption: ConsumptionData = {
    totalRequests: 200,
    avgPerDay: 20,
    avgPerWeek: 140,
    avgPerMonth: 600,
    modelTotals: {},
    defaultMultipliers: {},
    daily: { labels: [], values: [], byModel: {} },
    weekly: { labels: [], values: [], byModel: {} },
    monthly: { labels: [], values: [], byModel: {} },
  };

  it('renders totals: credits, tokens, requests', () => {
    const out = renderCredits(baseCredits, baseConsumption, false);
    expect(out).toContain('12.50');
    expect(out).toContain('Credits');
    expect(out).toContain('Input Tokens');
    expect(out).toContain('Output Tokens');
    expect(out).toContain('Requests');
  });

  it('renders avg per day and per request', () => {
    const out = renderCredits(baseCredits, baseConsumption, false);
    expect(out).toContain('1.25');
    expect(out).toContain('Avg/day');
    expect(out).toContain('Avg/req');
  });

  it('renders daily credits sparkline when > 1 label', () => {
    const out = renderCredits(baseCredits, baseConsumption, false);
    expect(out).toContain('Daily Credits');
    expect(out).toContain('2025-01-01');
  });

  it('renders per-model breakdown', () => {
    const out = renderCredits(baseCredits, baseConsumption, false);
    expect(out).toContain('Per-Model Usage');
    expect(out).toContain('claude-sonnet');
    expect(out).toContain('10.00 cr');
  });

  it('renders consumption averages', () => {
    const out = renderCredits(baseCredits, baseConsumption, false);
    expect(out).toContain('Req/day avg');
    expect(out).toContain('20.0');
    expect(out).toContain('Req/week avg');
    expect(out).toContain('140.0');
  });
});

describe('renderProduction', () => {
  const emptyProd: CodeProductionData = {
    summary: { totalAiLoc: 0, totalUserLoc: 0, totalLoc: 0, aiBlocks: 0, userBlocks: 0, aiRatio: 0, locCost2010: 0, costPerLoc: 0 },
    byLanguage: { labels: [], aiLoc: [], userLoc: [] },
    dailyTimeline: { labels: [], aiLoc: [], userLoc: [] },
    byWorkspace: { labels: [], aiLoc: [], userLoc: [] },
    dailyByWorkspace: {},
    dailyByModel: {},
    dailyByHarness: {},
  };

  it('shows empty state when no LOC', () => {
    const out = renderProduction(emptyProd, false);
    expect(out).toContain('No Code Production Data');
  });

  it('renders totals, AI ratio, and by-language table', () => {
    const data: CodeProductionData = {
      ...emptyProd,
      summary: { totalAiLoc: 800, totalUserLoc: 200, totalLoc: 1000, aiBlocks: 40, userBlocks: 10, aiRatio: 0.8, locCost2010: 0.1, costPerLoc: 0.001 },
      byLanguage: { labels: ['TypeScript', 'Python'], aiLoc: [600, 200], userLoc: [150, 50] },
      dailyTimeline: { labels: ['2025-01-01', '2025-01-02'], aiLoc: [400, 400], userLoc: [100, 100] },
    };
    const out = renderProduction(data, false);
    expect(out).toContain('1.0k');
    expect(out).toContain('AI LOC');
    expect(out).toContain('80.0%');
    expect(out).toContain('By Language');
    expect(out).toContain('TypeScript');
    expect(out).toContain('Python');
    expect(out).toContain('Daily Timeline');
    expect(out).toContain('AI');
    expect(out).toContain('User');
  });
});

describe('view all composition', () => {
  it('renders all six sections when composed together', () => {
    // Compose the same way the `all` switch branch does, using already-tested fixtures.
    const emptyPatterns: AntiPatternData = { patterns: [], totalOccurrences: 0, weeklyTrend: { labels: [], counts: [] }, groupScores: [], weeklyScores: { labels: [], series: [] } };
    const emptyFlow: FlowStateData = { days: [], overallFlowScore: 0, avgFollowUpSec: 0, avgBlockMin: 0, deepFlowDays: 0, totalDays: 0, weeklyTrend: { labels: [], scores: [] }, hourlyFlow: new Array(24).fill(0), suggestions: [] };
    const emptyCredits: AiCreditData = {
      totalCredits: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCacheReadTokens: 0,
      totalCacheWriteTokens: 0, totalRequests: 0, countedRequests: 0, partialRequests: 0,
      pendingRequests: 0, noDataRequests: 0, delegatedRequests: 0, finalizableRequests: 0,
      missingPct: 0, avgCreditsPerRequest: 0, avgCreditsPerDay: 0, costByModel: {},
      daily: { labels: [], credits: [], cumulative: [], byModel: {} },
      weekly: { labels: [], credits: [], cumulative: [], byModel: {} },
      dailyTokensByWorkspace: { labels: [], byWorkspace: {} },
      dailyTokensByHarness: { labels: [], byHarness: {} },
      topRequests: [],
    };
    const emptyConsumption: ConsumptionData = { totalRequests: 0, avgPerDay: 0, avgPerWeek: 0, avgPerMonth: 0, modelTotals: {}, defaultMultipliers: {}, daily: { labels: [], values: [], byModel: {} }, weekly: { labels: [], values: [], byModel: {} }, monthly: { labels: [], values: [], byModel: {} } };
    const emptyProd: CodeProductionData = { summary: { totalAiLoc: 0, totalUserLoc: 0, totalLoc: 0, aiBlocks: 0, userBlocks: 0, aiRatio: 0, locCost2010: 0, costPerLoc: 0 }, byLanguage: { labels: [], aiLoc: [], userLoc: [] }, dailyTimeline: { labels: [], aiLoc: [], userLoc: [] }, byWorkspace: { labels: [], aiLoc: [], userLoc: [] }, dailyByWorkspace: {}, dailyByModel: {}, dailyByHarness: {} };
    const thresholds: ContextVerdictThresholds = { optimalUtilization: 50, limitedUtilization: 80, adaptive: false, sampleSize: 0 };
    const emptyCtx: ContextManagementData = { overallScore: 0, estimatedContextWindow: 200_000, thresholds, workspaces: [], trend: [], workspaceTrend: [], totalCompactions: 0, fullCompactions: 0, simpleCompactions: 0, sessionsWithTokenData: 0, totalSessions: 0, antiPatterns: [], tips: [] };

    const combined = [
      renderOverview(stats, daily, harness, workspaces, hourly, false),
      renderContextHealth(emptyCtx, null, false),
      renderPatterns(emptyPatterns, [], false),
      renderFlow(emptyFlow, false),
      renderCredits(emptyCredits, emptyConsumption, false),
      renderProduction(emptyProd, false),
    ].join('\n');

    expect(combined).toContain('Sessions');
    expect(combined).toContain('No Session Data');
    expect(combined).toContain('No anti-patterns detected');
    expect(combined).toContain('No Flow Data');
    expect(combined).toContain('Credits');
    expect(combined).toContain('No Code Production Data');
  });
});

describe('view context dispatch (via renderContextHealth)', () => {
  const thresholds: ContextVerdictThresholds = { optimalUtilization: 50, limitedUtilization: 80, adaptive: false, sampleSize: 0 };

  const emptyCtx: ContextManagementData = {
    overallScore: 0,
    estimatedContextWindow: 200_000,
    thresholds,
    workspaces: [],
    trend: [],
    workspaceTrend: [],
    totalCompactions: 0,
    fullCompactions: 0,
    simpleCompactions: 0,
    sessionsWithTokenData: 0,
    totalSessions: 0,
    antiPatterns: [],
    tips: [],
  };

  it('renders empty state when no context sessions', () => {
    const out = renderContextHealth(emptyCtx, null, false);
    expect(out).toContain('No Session Data');
  });

  it('renders context data when sessions exist', () => {
    const ctx: ContextManagementData = {
      ...emptyCtx,
      overallScore: 80,
      totalSessions: 5,
      workspaces: [{
        workspaceId: 'w1',
        workspaceName: 'my-project',
        harness: 'claude',
        sessionCount: 5,
        requestsWithTokens: 50,
        avgPromptTokens: 40_000,
        maxPromptTokens: 80_000,
        avgUtilization: 25,
        peakUtilization: 60,
        saturation: 5,
        compactionCount: 0,
        costEfficiency: null,
        score: 80,
        verdict: 'optimal',
      }],
      trend: [
        { label: 'W1', avgUtilization: 20, compactions: 0, sessionsOverThreshold: 0 },
        { label: 'W2', avgUtilization: 30, compactions: 0, sessionsOverThreshold: 0 },
      ],
      tips: ['Keep sessions focused.'],
    };
    const out = renderContextHealth(ctx, null, false);
    expect(out).toContain('80/100');
    expect(out).toContain('my-project');
  });
});
