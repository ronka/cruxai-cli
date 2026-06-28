'use client';

import { useSubmissionFindingsQuery } from '@/hooks/api/rules';
import {
  PRACTICE_GROUPS,
  type RuleFinding,
  type PracticeGroup,
  type GroupScore,
  type SessionScore,
  type Tier,
} from '@/rule-engine/types';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

const SEVERITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const TIER_STYLES: Record<Tier, string> = {
  clean: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  minor: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400',
  noticeable: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  bad: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  severe: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const TIER_FILL: Record<Tier, string> = {
  clean: '#22c55e',
  minor: '#84cc16',
  noticeable: '#f59e0b',
  bad: '#f97316',
  severe: '#ef4444',
};

const GROUP_LABELS: Record<PracticeGroup, string> = {
  'prompt-quality': 'Prompt Quality',
  'session-hygiene': 'Session Hygiene',
  'code-review': 'Code Review',
  'tool-mastery': 'Tool Mastery',
  'context-management': 'Context Management',
};

const TARGET_SCORE = 90;

function ScoreRadar({ score }: { score: SessionScore }) {
  const data = PRACTICE_GROUPS.map(g => {
    const gs = score.groups[g];
    return {
      group: GROUP_LABELS[g],
      score: gs.score ?? 0,
      target: TARGET_SCORE,
      isNull: gs.score === null,
    };
  });
  const overallTier: Tier =
    score.overall >= 90 ? 'clean'
    : score.overall >= 75 ? 'minor'
    : score.overall >= 60 ? 'noticeable'
    : score.overall >= 40 ? 'bad'
    : 'severe';
  const fill = TIER_FILL[overallTier];

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="group"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <Radar
            name="A target"
            dataKey="target"
            stroke="#22c55e"
            strokeDasharray="4 4"
            strokeWidth={1}
            fill="none"
          />
          <Radar
            name="Session"
            dataKey="score"
            stroke={fill}
            fill={fill}
            fillOpacity={0.35}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function GroupScoreCard({ group }: { group: GroupScore }) {
  const isNull = group.score === null;
  return (
    <div className={`rounded-md border border-border px-3 py-2 ${isNull ? 'bg-muted/30' : 'bg-card'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className={`text-sm font-medium truncate ${isNull ? 'text-muted-foreground' : ''}`}>
            {GROUP_LABELS[group.group]}
          </div>
          <div className="text-xs text-muted-foreground">
            {isNull
              ? 'n/a — no rules'
              : `${group.findingCount} ${group.findingCount === 1 ? 'finding' : 'findings'}`}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isNull ? (
            <span className="text-sm font-mono tabular-nums text-muted-foreground">—</span>
          ) : (
            <>
              <span className="text-sm font-mono tabular-nums font-semibold">{group.score}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TIER_STYLES[group.tier!]}`}>
                {group.grade}
              </span>
            </>
          )}
        </div>
      </div>
      {!isNull && group.findingCount === 0 ? (
        <p className="text-xs text-muted-foreground mt-2">No issues detected.</p>
      ) : !isNull ? (
        <ul className="mt-2 space-y-1">
          {group.topContributors.map(c => (
            <li key={c.ruleId} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 px-1 py-0.5 rounded font-medium ${SEVERITY_STYLES[c.severity] ?? ''}`}>
                  {c.severity}
                </span>
                <span className="truncate">{c.name}</span>
              </div>
              <span className="font-mono tabular-nums text-muted-foreground shrink-0">
                −{c.penalty.toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FindingCard({ finding }: { finding: RuleFinding }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{finding.name}</span>
            <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${SEVERITY_STYLES[finding.severity] ?? ''}`}>
              {finding.severity}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{finding.description}</p>
          {finding.suggestion && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">{finding.suggestion}</p>
          )}
          {finding.examples.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {finding.examples.map((ex, i) => (
                <li key={i} className="text-xs font-mono bg-muted px-2 py-1 rounded truncate">{ex}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

interface RuleFindingsPanelProps {
  submissionId: string;
}

export function RuleFindingsPanel({ submissionId }: RuleFindingsPanelProps) {
  const { data, isLoading, isError } = useSubmissionFindingsQuery(submissionId);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-3">AI Practice Signals</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          Analyzing…
        </div>
      </div>
    );
  }

  if (isError || !data) return null;

  const { findings, score } = data;

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">AI Practice Signals</h3>
        <div className="text-sm font-mono tabular-nums">
          <span className="font-semibold">{score.overall}</span>
          <span className="text-muted-foreground"> — </span>
          <span className="font-semibold">{score.grade}</span>
        </div>
      </div>

      <ScoreRadar score={score} />
      <p className="text-xs text-muted-foreground text-center mb-4">
        Your session scored {score.overall} — A range is {TARGET_SCORE}+
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
        {PRACTICE_GROUPS.map(g => (
          <GroupScoreCard key={g} group={score.groups[g]} />
        ))}
      </div>

      {findings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No practice issues detected in this session.</p>
      ) : (
        <div className="space-y-3">
          {findings.map(f => <FindingCard key={f.ruleId} finding={f} />)}
        </div>
      )}
    </div>
  );
}
