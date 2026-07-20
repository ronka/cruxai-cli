import { Card, CardContent } from '@/components/ui/card';
import { loadEmployeeReport } from '@/lib/load-report';
import { ensureBuiltinRules } from '@/lib/register-rules';
import type { RecommendationResult } from '@crux/core';

const STATUS_LABEL: Record<string, string> = {
  good: 'Good',
  'needs-improvement': 'Improve',
  critical: 'Critical',
};

const STATUS_CLASS: Record<string, string> = {
  good: 'text-success',
  'needs-improvement': 'text-warning',
  critical: 'text-destructive',
};

const SCORE_BAR_CLASS: Record<string, string> = {
  good: 'bg-success',
  'needs-improvement': 'bg-warning',
  critical: 'bg-destructive',
};

function RecommendationCard({ r }: { r: RecommendationResult }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={['font-mono text-[0.65rem] uppercase tracking-[0.12em]', STATUS_CLASS[r.status] ?? ''].join(' ')}>
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                {r.category}
              </span>
            </div>
            <p className="font-semibold">{r.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{r.finding}</p>
            {r.recommendation && r.status !== 'good' && (
              <p className="mt-2 text-sm text-primary">{r.recommendation}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-mono tabular-nums">{r.score}</p>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">score</p>
            <div className="mt-1 h-1 w-16 rounded-full bg-muted overflow-hidden">
              <div
                className={['h-full rounded-full', SCORE_BAR_CLASS[r.status] ?? 'bg-primary'].join(' ')}
                style={{ width: `${Math.min(r.score, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function PatternsPage({ params }: { params: Promise<{ id: string }> }) {
  ensureBuiltinRules();

  const { id } = await params;
  const result = await loadEmployeeReport(id);

  if (!result.ok) {
    return (
      <main className="container flex-1 py-10">
        <p className="text-muted-foreground">{result.message}</p>
      </main>
    );
  }

  const { analyzer } = result;
  const recommendations = analyzer.getRecommendations();
  const good = recommendations.filter((r) => r.status === 'good');
  const improving = recommendations.filter((r) => r.status !== 'good');

  return (
    <main className="container flex-1 py-10">
      <section className="rise mb-10 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Patterns</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          What&apos;s working well.
        </h1>
        <p className="mt-3 text-muted-foreground">
          {good.length > 0
            ? `${good.length} positive practice${good.length === 1 ? '' : 's'} detected.`
            : 'Run more sessions to surface positive patterns.'}
        </p>
      </section>

      {good.length > 0 && (
        <section className="mb-8">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground mb-3">
            Strengths
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {good.map((r) => (
              <RecommendationCard key={r.checkId} r={r} />
            ))}
          </div>
        </section>
      )}

      {improving.length > 0 && (
        <section>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground mb-3">
            Opportunities
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {improving.map((r) => (
              <RecommendationCard key={r.checkId} r={r} />
            ))}
          </div>
        </section>
      )}

      {recommendations.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No pattern data yet. Run more sessions to surface insights.
          </CardContent>
        </Card>
      )}
    </main>
  );
}
