/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { renderSkillsReport } from './skills';
import type { TriagedCluster, RankedCatalogItem } from '../../core/skill-finder';

function makeCluster(overrides: Partial<TriagedCluster> = {}): TriagedCluster {
  return {
    id: 'c1',
    label: 'deploy-app',
    verdict: 'strong',
    reason: 'You deploy the application repeatedly.',
    suggestedSkillName: 'deploy-app',
    ...overrides,
  };
}

function makeCatalogItem(overrides: Partial<RankedCatalogItem> = {}): RankedCatalogItem {
  return {
    id: 'skill:skills/react.md',
    kind: 'skill',
    title: 'React Helper',
    description: 'Helps with React components',
    category: 'Frontend',
    relevanceScore: 100,
    matchReasons: ['You work with React frequently.'],
    ...overrides,
  };
}

describe('renderSkillsReport', () => {
  it('shows empty state when no strong opportunities or catalog items', () => {
    const maybe = makeCluster({ verdict: 'maybe' });
    const output = renderSkillsReport([maybe], [], false);
    expect(output).toContain('No Skill Opportunities Found');
  });

  it('renders custom skill opportunities section', () => {
    const cluster = makeCluster();
    const output = renderSkillsReport([cluster], [], false);
    expect(output).toContain('Custom Skill Opportunities');
    expect(output).toContain('deploy-app');
    expect(output).toContain('You deploy the application repeatedly.');
  });

  it('renders suggested skill name', () => {
    const cluster = makeCluster({ suggestedSkillName: 'deploy-app' });
    const output = renderSkillsReport([cluster], [], false);
    expect(output).toContain('deploy-app');
  });

  it('renders catalog section when catalog items present', () => {
    const item = makeCatalogItem();
    const output = renderSkillsReport([], [item], false);
    expect(output).toContain('Community Skills & Agents');
    expect(output).toContain('React Helper');
    expect(output).toContain('You work with React frequently.');
  });

  it('renders both sections when both have content', () => {
    const cluster = makeCluster();
    const item = makeCatalogItem();
    const output = renderSkillsReport([cluster], [item], false);
    expect(output).toContain('Custom Skill Opportunities');
    expect(output).toContain('Community Skills & Agents');
  });

  it('ANSI-colored output still contains plain text content', () => {
    const cluster = makeCluster();
    const withColor = renderSkillsReport([cluster], [], true);
    // Even with ANSI codes, key text should still be present
    expect(withColor).toContain('deploy-app');
    expect(withColor).toContain('You deploy the application repeatedly.');
  });

  it('shows skill kind tag for catalog items', () => {
    const item = makeCatalogItem({ kind: 'agent', title: 'My Agent' });
    const output = renderSkillsReport([], [item], false);
    expect(output).toContain('AGENT');
  });
});
