import { EmployeeCard } from '@/components/EmployeeCard';
import { SYNTHETIC_EMPLOYEES, getRoles, type Employee } from '@/lib/employees';
import { loadReport } from '@/lib/load-report';
import { ensureBuiltinRules } from '@/lib/register-rules';

export default async function Home() {
  ensureBuiltinRules();
  const result = await loadReport();

  // Fill the real employee's summary from the live Analyzer (when a report exists).
  const employees: Employee[] = SYNTHETIC_EMPLOYEES.map((emp) => {
    if (!emp.real || !result.ok) return emp;
    const { analyzer } = result;
    const stats = analyzer.getStats();
    const credits = analyzer.getAiCredits();
    const production = analyzer.getCodeProduction();
    const flow = analyzer.getFlowState();
    const daily = analyzer.getDailyActivity();
    return {
      ...emp,
      summary: {
        sessions: stats.totalSessions,
        requests: stats.totalRequests,
        credits: credits.totalCredits,
        aiLoc: production.summary.totalAiLoc,
        flowScore: Math.round(flow.overallFlowScore),
        daily: daily.sessions,
      },
    };
  });

  const roles = getRoles(employees);

  return (
    <main className="container flex-1 py-10">
        <section className="rise mb-10 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            team · grouped by role
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Your team&apos;s AI coding.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Every teammate who runs <span className="font-mono">crux scan</span>, grouped by role. Pick a person to
            open their analytics. <span className="font-mono text-foreground">You</span> is backed by your local
            report; the rest are simulated.
          </p>
        </section>

        <div className="space-y-10">
          {Object.entries(roles).map(([role, members]) => (
            <section key={role}>
              <div className="mb-4 flex items-baseline justify-between">
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                  {role}
                </p>
                <p className="font-mono text-[0.65rem] tabular-nums text-muted-foreground">
                  {members.length} {members.length === 1 ? 'person' : 'people'}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {members.map((emp) => (
                  <EmployeeCard key={emp.id} employee={emp} />
                ))}
              </div>
            </section>
          ))}
        </div>
    </main>
  );
}
