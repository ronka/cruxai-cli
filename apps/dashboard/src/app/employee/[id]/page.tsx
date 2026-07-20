import { Code, Coins, Gauge, MessagesSquare, Zap } from 'lucide-react';
import Link from 'next/link';

import { TabbedChart } from '@/components/Chart';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { getEmployee } from '@/lib/store';
import { loadEmployeeReport } from '@/lib/load-report';
import { ensureBuiltinRules } from '@/lib/register-rules';

const num = new Intl.NumberFormat('en-US');
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });

export default async function EmployeeOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = getEmployee(id);
  const simulated = employee ? !employee.real : false;

  ensureBuiltinRules();
  const result = await loadEmployeeReport(id);

  if (!result.ok) {
    return (
      <main className="container flex-1 py-10">
        <section className="rise mb-10 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            local · read-only · zero telemetry
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            No report found.
          </h1>
          <p className="mt-3 text-muted-foreground">{result.message}</p>
        </section>
      </main>
    );
  }

  const { analyzer } = result;
  const stats = analyzer.getStats();
  const credits = analyzer.getAiCredits();
  const production = analyzer.getCodeProduction();
  const daily = analyzer.getDailyActivity();

  const topModelEntry = Object.entries(credits.costByModel).sort(([, a], [, b]) => b.credits - a.credits)[0];
  const topModelName = topModelEntry?.[0] ?? 'Unknown';
  const topModelShare = credits.totalCredits > 0 ? (topModelEntry?.[1].credits ?? 0) / credits.totalCredits : 0;

  const dailyTabs = [
    { key: 'requests', label: 'Requests', data: daily.values },
    { key: 'sessions', label: 'Sessions', data: daily.sessions },
    { key: 'loc', label: 'LoC', data: daily.loc },
    { key: 'workspaces', label: 'Workspaces', data: daily.workspaces },
  ];

  const aiRatio = production.summary.aiRatio;

  const topModels = Object.entries(credits.costByModel)
    .sort(([, a], [, b]) => b.credits - a.credits)
    .slice(0, 5)
    .map(([name, breakdown]) => ({
      name,
      credits: breakdown.credits,
      requests: breakdown.requests,
    }));

  const topLanguages = production.byLanguage.labels
    .map((lang, i) => ({ lang, aiLoc: production.byLanguage.aiLoc[i] ?? 0 }))
    .sort((a, b) => b.aiLoc - a.aiLoc)
    .slice(0, 5);

  const antiPatterns = analyzer.getAntiPatterns();
  const topAntiPatterns = [...antiPatterns.patterns]
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 3);

  return (
    <main className="container flex-1 py-10">
      {/* Hero strip */}
      <section className="rise mb-10 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          local · read-only · zero telemetry
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {employee ? `${employee.name}'s AI coding, in numbers.` : 'Your AI coding, in numbers.'}
        </h1>
        <p className="mt-3 text-muted-foreground">
          A snapshot of the sessions, spend, and code that <span className="font-mono">crux scan</span> reads from
          your local AI assistant logs.
        </p>
        {simulated && (
          <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
            Simulated teammate — analytics shown are sample data.
          </p>
        )}
      </section>

      {/* Headline metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sessions"
          value={num.format(stats.totalSessions)}
          icon={MessagesSquare}
          description={`across ${stats.totalWorkspaces} workspaces`}
        />
        <StatCard
          label="Requests"
          value={num.format(stats.totalRequests)}
          icon={Zap}
          description="prompts sent to assistants"
        />
        <StatCard
          label="AI credits"
          value={usd.format(credits.totalCredits)}
          icon={Coins}
          description={`${pct.format(topModelShare)} on ${topModelName}`}
        />
        <StatCard
          label="AI-written LOC"
          value={num.format(production.summary.totalAiLoc)}
          icon={Code}
          description={`${pct.format(aiRatio)} of all code produced`}
        />
      </section>

      {/* Section cards */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Daily activity
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Last {daily.labels.length} days</p>
              </div>
              <div className="rounded-full bg-accent/15 p-2 text-accent">
                <Gauge className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <TabbedChart labels={daily.labels} tabs={dailyTabs} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              Top models
            </p>
            <ul className="mt-4 space-y-3">
              {topModels.map((m) => (
                <li key={m.name} className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-mono text-xs">{m.name}</span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {usd.format(m.credits)}
                    <span className="ml-2 text-xs">{num.format(m.requests)} req</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Code production + anti-pattern summary */}
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              Top languages · AI LOC
            </p>
            <ul className="mt-4 space-y-3">
              {topLanguages.map(({ lang, aiLoc }) => (
                <li key={lang} className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-mono text-xs">{lang}</span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {num.format(aiLoc)} loc
                  </span>
                </li>
              ))}
              {topLanguages.length === 0 && (
                <li className="text-sm text-muted-foreground">No language data</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                Top anti-patterns
              </p>
              <Link href={`/employee/${id}/anti-patterns`} className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-accent hover:underline">
                See all →
              </Link>
            </div>
            {topAntiPatterns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No anti-patterns detected.</p>
            ) : (
              <ul className="space-y-3">
                {topAntiPatterns.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-4 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">{p.severity} · {p.group}</p>
                      <p className="mt-0.5 text-sm font-medium">{p.name}</p>
                    </div>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                      {num.format(p.occurrences)}×
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
