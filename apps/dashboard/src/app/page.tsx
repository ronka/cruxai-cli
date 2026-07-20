import { EmployeeCard } from '@/components/EmployeeCard';
import { getRoles, listEmployees } from '@/lib/store';

// Roster reflects the live DB (uploads/seed change it), so never prerender it.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const roles = getRoles(listEmployees());

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
