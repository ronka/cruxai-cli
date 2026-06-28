/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import {
  buildTriagePrompt,
  validateTriage,
  buildCatalogTriagePrompt,
  validateCatalogPicks,
  buildSkillContentPrompt,
  parseSkillMarkdown,
  buildClusterSummaries,
  getUserContext,
  UNTRUSTED_DATA_GUARD,
  SCHEMA_TRIAGE,
  SCHEMA_CATALOG_PICKS,
  type ClusterSummary,
  type UserContext,
} from './skill-finder';
import type { WorkflowCluster } from './types';
import type { Session, SessionRequest } from './types/session-types';

function makeCluster(overrides: Partial<WorkflowCluster> = {}): WorkflowCluster {
  return {
    id: 'c1',
    label: 'deploy the application',
    canonicalPrompt: 'deploy the application',
    occurrences: 15,
    sessions: 8,
    workspaces: ['my-project'],
    harnesses: ['Claude'],
    avgCorrectionTurns: 0.5,
    totalTurns: 8,
    cancelRate: 0.1,
    firstSeen: '2026-01-01',
    lastSeen: '2026-06-01',
    examples: ['deploy the app', 'deploy to staging', 'run the deploy script'],
    skillDraft: '',
    ...overrides,
  };
}

function makeSession(overrides: Partial<Session> = {}): Session {
  const req: SessionRequest = {
    requestId: 'req1', timestamp: Date.now(),
    messageText: 'test react deploy docker',
    responseText: '', isCanceled: false, agentName: '', agentMode: '', modelId: '',
    toolsUsed: [], editedFiles: [], referencedFiles: [], slashCommand: '',
    variableKinds: {}, customInstructions: [], skillsUsed: [],
    firstProgress: null, totalElapsed: null, messageLength: 30, responseLength: 0,
    userCode: [{ language: 'typescript', loc: 100 }],
    aiCode: [{ language: 'typescript', loc: 200 }],
    toolConfirmations: [], promptTokens: null, completionTokens: null,
    cacheReadTokens: null, cacheWriteTokens: null, compaction: null,
    todoSnapshot: null, workType: 'feature',
  };
  return {
    sessionId: 's1', workspaceId: 'ws1', workspaceName: 'my-project',
    location: '/home/user', harness: 'Claude', creationDate: Date.now(),
    lastMessageDate: Date.now(), requestCount: 1, requests: [req],
    ...overrides,
  };
}

describe('buildClusterSummaries', () => {
  it('spotlights labels and limits examples', () => {
    const cluster = makeCluster({
      examples: ['e1', 'e2', 'e3', 'e4'],
    });
    const summaries = buildClusterSummaries([cluster]);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].examples).toHaveLength(3);
    expect(summaries[0].id).toBe('c1');
  });

  it('respects the limit param', () => {
    const clusters = Array.from({ length: 10 }, (_, i) => makeCluster({ id: `c${i}` }));
    expect(buildClusterSummaries(clusters, 5)).toHaveLength(5);
  });
});

describe('buildTriagePrompt', () => {
  const context: UserContext = {
    languages: ['typescript', 'python'],
    harnesses: ['Claude'],
    topics: ['deploy', 'docker'],
    workspaces: ['my-project'],
  };

  it('includes UNTRUSTED_DATA_GUARD in system prompt', () => {
    const summaries = buildClusterSummaries([makeCluster()]);
    const { system } = buildTriagePrompt(summaries, context);
    expect(system).toContain(UNTRUSTED_DATA_GUARD);
  });

  it('includes workspace filter in user prompt when provided', () => {
    const summaries = buildClusterSummaries([makeCluster()]);
    const { user } = buildTriagePrompt(summaries, context, 'my-project');
    expect(user).toContain('Currently filtering: my-project');
  });

  it('includes languages and harnesses in user prompt', () => {
    const summaries = buildClusterSummaries([makeCluster()]);
    const { user } = buildTriagePrompt(summaries, context);
    expect(user).toContain('typescript');
    expect(user).toContain('Claude');
  });
});

describe('validateTriage', () => {
  const summaries: ClusterSummary[] = [
    { id: 'c1', label: 'deploy the application', occurrences: 15, sessions: 8, cancelRate: 0.1, avgCorrectionTurns: 0.5, workspaces: [], examples: [] },
  ];

  it('parses valid strong verdict', () => {
    const raw = { items: [{ id: 'c1', verdict: 'strong', reason: 'Repeated deploy pattern', suggestedSkillName: 'deploy-app' }] };
    const result = validateTriage(raw, summaries);
    expect(result).toHaveLength(1);
    expect(result[0].verdict).toBe('strong');
    expect(result[0].suggestedSkillName).toBe('deploy-app');
    expect(result[0].label).toBe('deploy the application');
  });

  it('defaults invalid verdict to maybe', () => {
    const raw = { items: [{ id: 'c1', verdict: 'excellent', reason: 'test', suggestedSkillName: '' }] };
    const result = validateTriage(raw, summaries);
    expect(result[0].verdict).toBe('maybe');
  });

  it('handles array format', () => {
    const raw = [{ id: 'c1', verdict: 'strong', reason: 'test', suggestedSkillName: 'my-skill' }];
    const result = validateTriage(raw, summaries);
    expect(result).toHaveLength(1);
  });

  it('returns empty for empty input', () => {
    expect(validateTriage({ items: [] }, summaries)).toEqual([]);
    expect(validateTriage({}, summaries)).toEqual([]);
  });
});

describe('buildCatalogTriagePrompt', () => {
  const context: UserContext = { languages: ['typescript'], harnesses: ['Claude'], topics: ['react'], workspaces: ['app'] };
  const candidates = [{ id: 'skill:p1', kind: 'skill', title: 'React Helper', description: 'Helps with React', category: 'Frontend' }];

  it('includes UNTRUSTED_DATA_GUARD in system', () => {
    const { system } = buildCatalogTriagePrompt(candidates, [], context);
    expect(system).toContain(UNTRUSTED_DATA_GUARD);
  });

  it('includes catalog count in system prompt', () => {
    const { system } = buildCatalogTriagePrompt(candidates, [], context);
    expect(system).toContain(`${candidates.length} items`);
  });
});

describe('validateCatalogPicks', () => {
  const rawCatalog = [{
    kind: 'skill' as const, id: 'skill:skills/react.md', title: 'React Helper',
    description: 'Helps with React', category: 'Frontend',
    path: 'skills/react.md', url: 'https://awesome-copilot.github.com/skills/#react',
  }];

  it('enriches picks with catalog data', () => {
    const raw = { items: [{ id: 'skill:skills/react.md', reason: 'You work with React' }] };
    const result = validateCatalogPicks(raw, rawCatalog);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('React Helper');
    expect(result[0].matchReasons[0]).toBe('You work with React');
    expect(result[0].relevanceScore).toBe(100);
  });

  it('filters out picks without matching catalog items', () => {
    const raw = { items: [{ id: 'nonexistent', reason: 'test' }] };
    const result = validateCatalogPicks(raw, rawCatalog);
    expect(result).toHaveLength(0);
  });
});

describe('buildSkillContentPrompt', () => {
  it('includes UNTRUSTED_DATA_GUARD and label in prompts', () => {
    const { system, user } = buildSkillContentPrompt({
      label: 'deploy-app', pattern: 'deploy the application', occurrences: 10,
      sessions: 5, examples: ['deploy to staging'], skillDraft: '',
    });
    expect(system).toContain(UNTRUSTED_DATA_GUARD);
    expect(user).toContain('deploy-app');
    expect(user).toContain('10 times across 5 sessions');
  });
});

describe('parseSkillMarkdown', () => {
  it('strips markdown code fences', () => {
    const text = '```markdown\n---\nname: deploy-app\n---\n## When to Use\n```';
    const { content, filename } = parseSkillMarkdown(text, 'deploy-app');
    expect(content).not.toContain('```');
    expect(filename).toBe('deploy-app/SKILL.md');
  });

  it('slugifies the label for filename', () => {
    const { filename } = parseSkillMarkdown('# Test', 'Run Docker Build & Push');
    expect(filename).toBe('run-docker-build-push/SKILL.md');
  });
});

describe('getUserContext', () => {
  it('extracts languages from code blocks', () => {
    const session = makeSession();
    const ctx = getUserContext([session]);
    expect(ctx.languages).toContain('typescript');
  });

  it('extracts harnesses', () => {
    const ctx = getUserContext([makeSession()]);
    expect(ctx.harnesses).toContain('Claude');
  });

  it('extracts topic keywords from message text', () => {
    const ctx = getUserContext([makeSession()]);
    expect(ctx.topics).toContain('react');
    expect(ctx.topics).toContain('deploy');
    expect(ctx.topics).toContain('docker');
  });

  it('returns empty context for empty sessions', () => {
    const ctx = getUserContext([]);
    expect(ctx.languages).toEqual([]);
    expect(ctx.harnesses).toEqual([]);
  });
});

describe('schema exports', () => {
  it('SCHEMA_TRIAGE has required properties', () => {
    expect(SCHEMA_TRIAGE.name).toBe('skill_triage');
    const itemSchema = (SCHEMA_TRIAGE.schema.properties as Record<string, unknown>);
    expect(itemSchema).toBeDefined();
  });

  it('SCHEMA_CATALOG_PICKS has required properties', () => {
    expect(SCHEMA_CATALOG_PICKS.name).toBe('catalog_picks');
  });
});
