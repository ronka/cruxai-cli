/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { renderContextHealth } from './context-health';
import { utilBar, sparkline, table, visibleLen, pad } from '../render/term';
import type { ContextManagementData, ContextVerdictThresholds, WorkspaceContextScore } from '../../core/types';

const thresholds: ContextVerdictThresholds = {
  optimalUtilization: 50,
  limitedUtilization: 80,
  adaptive: false,
  sampleSize: 0,
};

function ws(overrides: Partial<WorkspaceContextScore>): WorkspaceContextScore {
  return {
    workspaceId: 'w1',
    workspaceName: 'my-project',
    harness: 'claude',
    sessionCount: 3,
    requestsWithTokens: 30,
    avgPromptTokens: 42_000,
    maxPromptTokens: 90_000,
    avgUtilization: 31.2,
    peakUtilization: 70,
    saturation: 5,
    compactionCount: 0,
    costEfficiency: null,
    score: 82,
    verdict: 'optimal',
    ...overrides,
  };
}

function baseData(overrides: Partial<ContextManagementData>): ContextManagementData {
  return {
    overallScore: 75,
    estimatedContextWindow: 200_000,
    thresholds,
    workspaces: [ws({})],
    trend: [
      { label: 'W1', avgUtilization: 30, compactions: 0, sessionsOverThreshold: 0 },
      { label: 'W2', avgUtilization: 55, compactions: 2, sessionsOverThreshold: 1 },
    ],
    workspaceTrend: [],
    totalCompactions: 2,
    fullCompactions: 1,
    simpleCompactions: 1,
    sessionsWithTokenData: 3,
    totalSessions: 3,
    antiPatterns: [],
    tips: ['Keep sessions focused.'],
    ...overrides,
  };
}

describe('term helpers', () => {
  it('visibleLen ignores ANSI codes', () => {
    expect(visibleLen('[1mhi[0m')).toBe(2);
  });

  it('pad accounts for ANSI width', () => {
    const colored = '[1mab[0m';
    expect(visibleLen(pad(colored, 5))).toBe(5);
  });

  it('utilBar renders fixed-width bar with percent', () => {
    const out = utilBar(false, 50, 'yellow', 10);
    expect(out).toContain('50.0%');
    expect(out).toMatch(/[█]{5}[░]{5}/);
  });

  it('sparkline maps values and gaps', () => {
    const out = sparkline([0, 50, 100, null], 100);
    expect(out.length).toBe(4);
    expect(out[3]).toBe(' ');
    expect(out[0]).toBe('▁');
    expect(out[2]).toBe('█');
  });

  it('sparkline returns empty for all-null', () => {
    expect(sparkline([null, null])).toBe('');
  });

  it('table aligns columns', () => {
    const out = table(false, [{ header: 'A' }, { header: 'B', align: 'right' }], [['x', '1'], ['yy', '22']]);
    const rows = out.split('\n');
    expect(rows[0]).toContain('A');
    expect(rows.length).toBe(4); // header, rule, 2 body
  });
});

describe('renderContextHealth', () => {
  it('shows empty state when no sessions', () => {
    const out = renderContextHealth(baseData({ totalSessions: 0 }), null, false);
    expect(out).toContain('No Session Data');
  });

  it('renders score, insights, trend and workspace table', () => {
    const out = renderContextHealth(baseData({}), null, false);
    expect(out).toContain('75/100');
    expect(out).toContain('Insights');
    expect(out).toContain('Keep sessions focused.');
    expect(out).toContain('Context Utilization Trend');
    expect(out).toContain('Per-Workspace Context Session Health');
    expect(out).toContain('my-project');
    expect(out).toContain('optimal');
  });

  it('truncates long workspace names', () => {
    const longName = 'a'.repeat(40);
    const out = renderContextHealth(baseData({ workspaces: [ws({ workspaceName: longName })] }), null, false);
    expect(out).toContain('…');
    expect(out).not.toContain(longName);
  });

  it('emits ANSI codes when color enabled', () => {
    const out = renderContextHealth(baseData({}), null, true);
    // eslint-disable-next-line no-control-regex
    expect(out).toMatch(/\[/);
  });

  it('renders the session drill-down when sessionData provided', () => {
    const out = renderContextHealth(baseData({}), {
      workspaceName: 'my-project',
      estimatedContextWindow: 200_000,
      thresholds,
      sessions: [{
        sessionId: 's1',
        date: '2025-06-01',
        harness: 'claude',
        requestCount: 12,
        requestsWithTokens: 12,
        avgPromptTokens: 40_000,
        maxPromptTokens: 90_000,
        avgUtilization: 25,
        peakUtilization: 60,
        contextWindow: 200_000,
        compactionCount: 1,
        tokenCurve: [10_000, 40_000, null, 90_000],
        saturation: 8,
        costEfficiency: null,
        verdict: 'optimal',
        events: [{ requestIndex: 2, type: 'compaction', label: 'compaction' }],
        requestQueries: [],
        hasPerRequestTokens: true,
      }],
    }, false);
    expect(out).toContain('Sessions — my-project');
    expect(out).toContain('2025-06-01');
    expect(out).toContain('1C');
  });
});
