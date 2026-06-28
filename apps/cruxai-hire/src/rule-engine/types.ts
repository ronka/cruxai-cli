export type RuleSeverity = 'high' | 'medium' | 'low';
export type RuleScope = 'requests' | 'session';
export type PracticeGroup =
  | 'prompt-quality'
  | 'session-hygiene'
  | 'code-review'
  | 'tool-mastery'
  | 'context-management';

export const PRACTICE_GROUPS: PracticeGroup[] = [
  'prompt-quality',
  'session-hygiene',
  'code-review',
  'tool-mastery',
  'context-management',
];

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
export type Tier = 'clean' | 'minor' | 'noticeable' | 'bad' | 'severe';

export interface GroupContributor {
  ruleId: string;
  name: string;
  severity: RuleSeverity;
  penalty: number;
}

export interface GroupScore {
  group: PracticeGroup;
  score: number | null;
  grade: Grade | null;
  tier: Tier | null;
  weight: number;
  findingCount: number;
  totalPenalty: number;
  topContributors: GroupContributor[];
}

export interface SessionScore {
  overall: number;
  grade: Grade;
  findingCount: number;
  groups: Record<PracticeGroup, GroupScore>;
}

export interface Rule {
  id: string;
  name: string;
  group: PracticeGroup;
  severity: RuleSeverity;
  scope: RuleScope;
  description: string;
  detect: (session: Session, rule: Rule) => RuleFinding | null;
}

export interface SessionRequest {
  messageText: string;
  messageLength: number;
  isCanceled: boolean;
  totalElapsed: number | null;
  modelId: string;
  aiCode: { language: string; loc: number }[];
}

export interface Session {
  requests: SessionRequest[];
}

export interface RuleFinding {
  ruleId: string;
  name: string;
  severity: RuleSeverity;
  group: PracticeGroup;
  scope: RuleScope;
  occurrences: number;
  total: number;
  ratio: number;
  description: string;
  suggestion: string;
  examples: string[];
}

export interface RuleEngineOptions {
  rules: Rule[];
  logger?: { warn(msg: string): void };
}

export interface RuleEngine {
  getRules(): Rule[];
  analyze(session: Session): RuleFinding[];
  analyzeOne(session: Session, ruleId: string): RuleFinding | null;
  score(session: Session, opts?: import('./scoring').ScoringOptions): SessionScore;
}
