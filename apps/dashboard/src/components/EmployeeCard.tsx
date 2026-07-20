import Link from 'next/link';

import { Sparkline } from '@/components/Sparkline';
import { Card, CardContent } from '@/components/ui/card';
import type { Employee } from '@/lib/store';

const num = new Intl.NumberFormat('en-US');
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-serif text-lg font-semibold tabular-nums leading-none">{value}</p>
    </div>
  );
}

export function EmployeeCard({ employee }: { employee: Employee }) {
  const s = employee.summary;

  return (
    <Link href={`/employee/${employee.id}`} className="block">
      <Card className="h-full transition-colors hover:border-accent/60">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-serif text-lg font-semibold leading-tight">{employee.name}</p>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
                {employee.role}
              </p>
            </div>
            <span
              className={[
                'shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.12em]',
                employee.real ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground',
              ].join(' ')}
            >
              {employee.real ? 'Real' : 'Sim'}
            </span>
          </div>

          {s ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Sessions" value={num.format(s.sessions)} />
                <Metric label="Requests" value={num.format(s.requests)} />
                <Metric label="AI credits" value={usd.format(s.credits)} />
                <Metric label="AI LoC" value={num.format(s.aiLoc)} />
              </div>
              <div className="mt-auto pt-4">
                <Sparkline data={s.daily} />
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No local report — run <span className="font-mono">crux scan</span>.</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
