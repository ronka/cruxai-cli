import { Card, CardContent } from '@/components/ui/card';
import { loadEmployeeReport } from '@/lib/load-report';
import { ensureBuiltinRules } from '@/lib/register-rules';

const num = new Intl.NumberFormat('en-US');

const SEVERITY_LABEL: Record<string, string> = {
  high: 'High',
  medium: 'Med',
  low: 'Low',
};

const SEVERITY_CLASS: Record<string, string> = {
  high: 'text-destructive',
  medium: 'text-warning',
  low: 'text-muted-foreground',
};

export default async function AntiPatternsPage({ params }: { params: Promise<{ id: string }> }) {
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
  const antiPatterns = analyzer.getAntiPatterns();
  const sorted = [...antiPatterns.patterns].sort((a, b) => b.occurrences - a.occurrences);

  return (
    <main className="container flex-1 py-10">
      <section className="rise mb-10 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Anti-Patterns</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Habits worth changing.
        </h1>
        <p className="mt-3 text-muted-foreground">
          {antiPatterns.totalOccurrences > 0
            ? `${num.format(antiPatterns.totalOccurrences)} occurrences detected across ${sorted.length} patterns.`
            : 'No anti-patterns detected.'}
        </p>
      </section>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No anti-patterns found in your data. Keep it up!
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={['font-mono text-[0.65rem] uppercase tracking-[0.12em]', SEVERITY_CLASS[p.severity] ?? ''].join(' ')}>
                        {SEVERITY_LABEL[p.severity] ?? p.severity}
                      </span>
                      <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                        {p.group}
                      </span>
                    </div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                    {p.suggestion && (
                      <p className="mt-2 text-sm text-accent">{p.suggestion}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-mono tabular-nums">{num.format(p.occurrences)}</p>
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">occurrences</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
