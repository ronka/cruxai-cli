import { Code, Coins, Gauge, MessagesSquare, Zap } from 'lucide-react';

import { Header } from '@/components/Header';
import { Sparkline } from '@/components/Sparkline';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { overview, stats, topModels } from '@/lib/mock-data';

const num = new Intl.NumberFormat('en-US');
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });

export default function Home() {
  const aiRatio = overview.aiLoc / (overview.aiLoc + overview.userLoc);

  return (
    <div className="flex min-h-screen flex-col bg-grain">
      <Header />

      <main className="container flex-1 py-10">
        {/* Hero strip */}
        <section className="rise mb-10 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            local · read-only · zero telemetry
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Your AI coding, in numbers.
          </h1>
          <p className="mt-3 text-muted-foreground">
            A snapshot of the sessions, spend, and code that <span className="font-mono">crux scan</span> reads from
            your local AI assistant logs.
          </p>
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
            value={usd.format(overview.totalCredits)}
            icon={Coins}
            description={`${pct.format(overview.topModel.share)} on ${overview.topModel.name}`}
          />
          <StatCard
            label="AI-written LOC"
            value={num.format(overview.aiLoc)}
            icon={Code}
            description={`${pct.format(aiRatio)} of all code produced`}
          />
        </section>

        {/* Section cards — the seams where live Analyzer data plugs in */}
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                    Daily activity
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">Credits spent, last 12 days</p>
                </div>
                <div className="rounded-full bg-accent/15 p-2 text-accent">
                  <Gauge className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-6">
                <Sparkline data={overview.dailyCredits} />
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

        <p className="mt-8 font-mono text-xs text-muted-foreground">
          Showing sample data. Wire up <span className="text-foreground">@crux/core</span> to render your own
          report.
        </p>
      </main>
    </div>
  );
}
