import { describe, it, expect } from 'vitest';
import { scoreFindings } from '../scoring';
import type { RuleFinding } from '../types';

function f(partial: Partial<RuleFinding> & Pick<RuleFinding, 'ruleId' | 'severity' | 'group' | 'scope'>): RuleFinding {
  return {
    name: partial.ruleId,
    occurrences: 0,
    total: 0,
    ratio: 0,
    description: '',
    suggestion: '',
    examples: [],
    ...partial,
  };
}

// PRD §6 worked example
const workedExampleFindings: RuleFinding[] = [
  f({ ruleId: 'vibe-coding',          group: 'code-review',     severity: 'high',   scope: 'session' }),
  f({ ruleId: 'speed-accept',         group: 'code-review',     severity: 'high',   scope: 'session' }),
  f({ ruleId: 'copy-paste-blindness', group: 'code-review',     severity: 'high',   scope: 'session' }),
  f({ ruleId: 'lazy-prompting',       group: 'prompt-quality',  severity: 'medium', scope: 'requests', ratio: 0.44 }),
  f({ ruleId: 'low-constraint-usage', group: 'prompt-quality',  severity: 'medium', scope: 'requests', ratio: 0.78 }),
  f({ ruleId: 'frustration-signals',  group: 'prompt-quality',  severity: 'medium', scope: 'requests', ratio: 0.11 }),
  f({ ruleId: 'yolo-mode',            group: 'code-review',     severity: 'high',   scope: 'requests', ratio: 0.95 }),
  f({ ruleId: 'runaway-agent-loops',  group: 'session-hygiene', severity: 'high',   scope: 'requests', ratio: 0.17 }),
];

describe('scoreFindings', () => {
  it('returns 100/A for empty findings', () => {
    const result = scoreFindings([]);
    expect(result.overall).toBe(100);
    expect(result.grade).toBe('A');
    expect(result.findingCount).toBe(0);
    for (const g of ['prompt-quality', 'session-hygiene', 'code-review', 'tool-mastery', 'context-management'] as const) {
      expect(result.groups[g].score).toBe(100);
      expect(result.groups[g].grade).toBe('A');
      expect(result.groups[g].tier).toBe('clean');
      expect(result.groups[g].findingCount).toBe(0);
    }
  });

  it('produces overall 78 / B for the PRD §6 worked example', () => {
    const result = scoreFindings(workedExampleFindings);
    expect(result.overall).toBe(78);
    expect(result.grade).toBe('B');
  });

  it('populates topContributors sorted by penalty desc, capped at 3', () => {
    const { groups } = scoreFindings(workedExampleFindings);

    const cr = groups['code-review'].topContributors;
    expect(cr.length).toBe(3);
    expect(cr.every(c => c.penalty === 20)).toBe(true);
    expect(cr.map(c => c.ruleId).sort()).toEqual(
      ['vibe-coding', 'speed-accept', 'copy-paste-blindness', 'yolo-mode']
        .slice(0, 3)
        .sort(),
    );

    const pq = groups['prompt-quality'].topContributors;
    expect(pq[0].ruleId).toBe('low-constraint-usage');
    expect(pq[0].penalty).toBeCloseTo(10, 5);
    expect(pq.length).toBe(3);

    expect(groups['tool-mastery'].topContributors).toEqual([]);
    expect(groups['context-management'].topContributors).toEqual([]);
  });

  describe('null-group handling', () => {
    it('returns null score/grade/tier for groups with no registered rules', () => {
      const findings: RuleFinding[] = [
        f({ ruleId: 'lazy-prompting', group: 'prompt-quality', severity: 'medium', scope: 'requests', ratio: 0.44 }),
        f({ ruleId: 'vibe-coding', group: 'code-review', severity: 'high', scope: 'session' }),
      ];
      const result = scoreFindings(findings, {
        registeredGroups: ['prompt-quality', 'code-review'],
        logger: { warn: () => {} },
      });

      expect(result.groups['prompt-quality'].score).not.toBeNull();
      expect(result.groups['code-review'].score).not.toBeNull();

      for (const g of ['session-hygiene', 'tool-mastery', 'context-management'] as const) {
        expect(result.groups[g].score).toBeNull();
        expect(result.groups[g].grade).toBeNull();
        expect(result.groups[g].tier).toBeNull();
      }
    });

    it('excludes null groups from overall weighted mean', () => {
      const findings: RuleFinding[] = [
        f({ ruleId: 'vibe-coding', group: 'code-review', severity: 'high', scope: 'session' }),
      ];
      const result = scoreFindings(findings, {
        registeredGroups: ['code-review', 'prompt-quality'],
        logger: { warn: () => {} },
      });
      expect(result.groups['code-review'].score).toBe(80);
      expect(result.groups['prompt-quality'].score).toBe(100);
      // mean of just code-review (80) and prompt-quality (100) = 90
      expect(result.overall).toBe(90);
    });

    it('skips findings with unknown group and warns', () => {
      const warns: string[] = [];
      const findings = [
        f({ ruleId: 'rogue', group: 'totally-fake' as never, severity: 'high', scope: 'session' }),
        f({ ruleId: 'vibe-coding', group: 'code-review', severity: 'high', scope: 'session' }),
      ];
      const result = scoreFindings(findings, { logger: { warn: m => warns.push(m) } });
      expect(warns.length).toBe(1);
      expect(warns[0]).toContain('totally-fake');
      expect(result.findingCount).toBe(1);
      expect(result.groups['code-review'].score).toBe(80);
    });

    it('preserves worked-example values when all 5 groups are registered', () => {
      const result = scoreFindings(workedExampleFindings, {
        registeredGroups: ['prompt-quality', 'session-hygiene', 'code-review', 'tool-mastery', 'context-management'],
        logger: { warn: () => {} },
      });
      expect(result.overall).toBe(78);
      expect(result.grade).toBe('B');
    });
  });

  it('caps topContributors at 3 even with 5+ findings in a group', () => {
    const many: RuleFinding[] = Array.from({ length: 5 }, (_, i) =>
      f({ ruleId: `lo-${i}`, group: 'tool-mastery', severity: 'low', scope: 'session' }),
    );
    const { groups } = scoreFindings(many);
    expect(groups['tool-mastery'].topContributors.length).toBe(3);
    expect(groups['tool-mastery'].findingCount).toBe(5);
  });

  describe('ScoringOptions', () => {
    it('is identity when opts is undefined or empty (worked example)', () => {
      const withUndef = scoreFindings(workedExampleFindings);
      const withEmpty = scoreFindings(workedExampleFindings, {});
      expect(withUndef).toEqual(withEmpty);
      expect(withUndef.overall).toBe(78);
    });

    it('severityPenalties.high override changes group penalty', () => {
      // code-review with 4 high findings: 15*4 = 60 → score 40
      const { groups } = scoreFindings(workedExampleFindings, {
        severityPenalties: { high: 15 },
      });
      expect(groups['code-review'].score).toBe(40);
    });

    it('groupWeights re-weights the overall mean', () => {
      const base = scoreFindings(workedExampleFindings).overall;
      const weighted = scoreFindings(workedExampleFindings, {
        groupWeights: { 'code-review': 2 },
      }).overall;
      expect(weighted).toBeLessThan(base);
      expect(scoreFindings(workedExampleFindings, {
        groupWeights: { 'code-review': 2 },
      }).groups['code-review'].weight).toBe(2);
    });

    it('scopeScale.slope: 1 halves lazy-prompting penalty', () => {
      // lazy-prompting ratio 0.44, base 10. Default slope=2 → 8.8. slope=1 → 4.4.
      const findings = [
        f({ ruleId: 'lazy-prompting', group: 'prompt-quality', severity: 'medium', scope: 'requests', ratio: 0.44 }),
      ];
      const result = scoreFindings(findings, { scopeScale: { slope: 1 } });
      expect(result.groups['prompt-quality'].totalPenalty).toBeCloseTo(4.4, 5);
    });

    it('scopeScale.floor: 0.5 raises low-ratio penalty up to the floor', () => {
      // frustration-signals ratio 0.11, base 10. floor 0.5 → 10 * 0.5 = 5.0
      const findings = [
        f({ ruleId: 'frustration-signals', group: 'prompt-quality', severity: 'medium', scope: 'requests', ratio: 0.11 }),
      ];
      const result = scoreFindings(findings, { scopeScale: { floor: 0.5 } });
      expect(result.groups['prompt-quality'].totalPenalty).toBeCloseTo(5.0, 5);
    });

    it('groupWeights for groups with zero rules is silently ignored', () => {
      const findings = [
        f({ ruleId: 'vibe-coding', group: 'code-review', severity: 'high', scope: 'session' }),
      ];
      const result = scoreFindings(findings, {
        registeredGroups: ['code-review'],
        groupWeights: { 'tool-mastery': 10 }, // tool-mastery has no rules → null → excluded
        logger: { warn: () => {} },
      });
      expect(result.groups['tool-mastery'].score).toBeNull();
      // overall is just code-review's 80
      expect(result.overall).toBe(80);
    });
  });

  it('matches PRD §6 per-group scores', () => {
    const { groups } = scoreFindings(workedExampleFindings);

    expect(groups['code-review'].score).toBe(20);
    expect(groups['code-review'].grade).toBe('F');
    expect(groups['code-review'].tier).toBe('severe');
    expect(groups['code-review'].findingCount).toBe(4);
    expect(groups['code-review'].totalPenalty).toBeCloseTo(80, 1);

    expect(groups['prompt-quality'].score).toBe(79);
    expect(groups['prompt-quality'].grade).toBe('B');
    expect(groups['prompt-quality'].tier).toBe('minor');
    expect(groups['prompt-quality'].findingCount).toBe(3);
    expect(groups['prompt-quality'].totalPenalty).toBeCloseTo(21.3, 1);

    expect(groups['session-hygiene'].score).toBe(93);
    expect(groups['session-hygiene'].grade).toBe('A');
    expect(groups['session-hygiene'].tier).toBe('clean');
    expect(groups['session-hygiene'].findingCount).toBe(1);

    expect(groups['tool-mastery'].score).toBe(100);
    expect(groups['tool-mastery'].findingCount).toBe(0);

    expect(groups['context-management'].score).toBe(100);
    expect(groups['context-management'].findingCount).toBe(0);

    for (const g of ['prompt-quality', 'session-hygiene', 'code-review', 'tool-mastery', 'context-management'] as const) {
      expect(groups[g].weight).toBe(1);
    }
  });
});
