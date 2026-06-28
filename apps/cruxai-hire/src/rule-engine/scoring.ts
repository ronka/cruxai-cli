import {
  PRACTICE_GROUPS,
  type RuleFinding,
  type PracticeGroup,
  type RuleSeverity,
  type Grade,
  type Tier,
  type GroupContributor,
  type GroupScore,
  type SessionScore,
} from './types';

export interface ScoringOptions {
  /** Groups that have at least one rule registered. Groups absent here score `null`. Default: all 5 groups. */
  registeredGroups?: PracticeGroup[];
  /** Per-group weight override for the overall weighted mean. Default: 1.0 each. */
  groupWeights?: Partial<Record<PracticeGroup, number>>;
  /** Override severity base penalties. Default: { high: 20, medium: 10, low: 5 }. */
  severityPenalties?: { high?: number; medium?: number; low?: number };
  /** Override request-scope scaling. Default: { slope: 2, floor: 0.25 }. */
  scopeScale?: { slope?: number; floor?: number };
  logger?: { warn(msg: string): void };
}

const DEFAULT_BASE_PENALTY: Record<RuleSeverity, number> = { high: 20, medium: 10, low: 5 };
const DEFAULT_SCOPE_SLOPE = 2;
const DEFAULT_SCOPE_FLOOR = 0.25;
const DEFAULT_GROUP_WEIGHT = 1;

const GRADE_TO_TIER: Record<Grade, Tier> = {
  A: 'clean',
  B: 'minor',
  C: 'noticeable',
  D: 'bad',
  F: 'severe',
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function gradeFor(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

interface ResolvedOptions {
  basePenalty: Record<RuleSeverity, number>;
  scopeSlope: number;
  scopeFloor: number;
}

function resolveOptions(opts: ScoringOptions): ResolvedOptions {
  return {
    basePenalty: {
      high: opts.severityPenalties?.high ?? DEFAULT_BASE_PENALTY.high,
      medium: opts.severityPenalties?.medium ?? DEFAULT_BASE_PENALTY.medium,
      low: opts.severityPenalties?.low ?? DEFAULT_BASE_PENALTY.low,
    },
    scopeSlope: opts.scopeScale?.slope ?? DEFAULT_SCOPE_SLOPE,
    scopeFloor: opts.scopeScale?.floor ?? DEFAULT_SCOPE_FLOOR,
  };
}

function penaltyFor(finding: RuleFinding, resolved: ResolvedOptions): number {
  const base = resolved.basePenalty[finding.severity];
  const scale = finding.scope === 'session'
    ? 1.0
    : clamp(finding.ratio * resolved.scopeSlope, resolved.scopeFloor, 1.0);
  return base * scale;
}

export function scoreFindings(findings: RuleFinding[], opts: ScoringOptions = {}): SessionScore {
  const logger = opts.logger ?? console;
  const resolved = resolveOptions(opts);
  const registered = opts.registeredGroups
    ? new Set(opts.registeredGroups)
    : new Set(PRACTICE_GROUPS);

  const groupAccum: Record<PracticeGroup, { totalPenalty: number; contributors: GroupContributor[] }> = {
    'prompt-quality': { totalPenalty: 0, contributors: [] },
    'session-hygiene': { totalPenalty: 0, contributors: [] },
    'code-review': { totalPenalty: 0, contributors: [] },
    'tool-mastery': { totalPenalty: 0, contributors: [] },
    'context-management': { totalPenalty: 0, contributors: [] },
  };

  let countedFindings = 0;
  for (const f of findings) {
    if (!(f.group in groupAccum)) {
      logger.warn(`scoreFindings: skipping finding '${f.ruleId}' with unknown group '${f.group}'`);
      continue;
    }
    const penalty = penaltyFor(f, resolved);
    groupAccum[f.group].totalPenalty += penalty;
    groupAccum[f.group].contributors.push({
      ruleId: f.ruleId,
      name: f.name,
      severity: f.severity,
      penalty,
    });
    countedFindings += 1;
  }

  const groups = {} as Record<PracticeGroup, GroupScore>;
  for (const g of PRACTICE_GROUPS) {
    const { totalPenalty, contributors } = groupAccum[g];
    const hasRules = registered.has(g);
    const score = hasRules ? clamp(Math.round(100 - totalPenalty), 0, 100) : null;
    const grade = score === null ? null : gradeFor(score);
    const topContributors = [...contributors]
      .sort((a, b) => b.penalty - a.penalty)
      .slice(0, 3);
    groups[g] = {
      group: g,
      score,
      grade,
      tier: grade ? GRADE_TO_TIER[grade] : null,
      weight: opts.groupWeights?.[g] ?? DEFAULT_GROUP_WEIGHT,
      findingCount: contributors.length,
      totalPenalty,
      topContributors,
    };
  }

  const scoringGroups = PRACTICE_GROUPS.filter(g => groups[g].score !== null);
  const totalWeight = scoringGroups.reduce((s, g) => s + groups[g].weight, 0);
  const overall = totalWeight > 0
    ? Math.round(
        scoringGroups.reduce((s, g) => s + groups[g].weight * (groups[g].score as number), 0) /
          totalWeight,
      )
    : 100;

  return {
    overall,
    grade: gradeFor(overall),
    findingCount: countedFindings,
    groups,
  };
}
