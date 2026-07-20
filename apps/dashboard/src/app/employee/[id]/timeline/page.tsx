import { TabbedChart } from '@/components/Chart';
import { Card, CardContent } from '@/components/ui/card';
import { loadEmployeeReport } from '@/lib/load-report';

const num = new Intl.NumberFormat('en-US');

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
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
  const daily = analyzer.getDailyActivity();
  const sessions = analyzer.getSessions(1, 24);

  const dailyTabs = [
    { key: 'requests', label: 'Requests', data: daily.values },
    { key: 'sessions', label: 'Sessions', data: daily.sessions },
    { key: 'loc', label: 'LoC', data: daily.loc },
    { key: 'workspaces', label: 'Workspaces', data: daily.workspaces },
  ];

  return (
    <main className="container flex-1 py-10">
      <section className="rise mb-10 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Timeline</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Activity over time.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Daily activity across your AI coding sessions.
        </p>
      </section>

      <section className="mb-6">
        <Card>
          <CardContent className="p-6">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground mb-4">
              Daily activity · {daily.labels.length} days
            </p>
            <TabbedChart labels={daily.labels} tabs={dailyTabs} height={280} />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardContent className="p-6">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground mb-4">
              Recent sessions · {sessions.total} total
            </p>
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {sessions.sessions.map((s) => (
                <li key={s.sessionId} className="flex items-start justify-between gap-4 border-b border-border/40 pb-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-muted-foreground">{s.workspaceName}</p>
                    <p className="mt-0.5 truncate text-sm">
                      {s.firstMessage || <span className="italic text-muted-foreground">No preview</span>}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    {num.format(s.requestCount)} req
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
