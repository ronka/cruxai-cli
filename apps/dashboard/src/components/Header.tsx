import Link from 'next/link';

import { NavLinks } from '@/components/NavLinks';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Employee } from '@/lib/employees';

export function Header({ employee }: { employee?: Employee }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-baseline gap-3 shrink-0">
            <span className="font-serif text-2xl font-semibold tracking-tight">crux</span>
            <span className="hidden font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
              {employee ? 'team' : 'usage report'}
            </span>
          </Link>

          {employee ? (
            <>
              <NavLinks employeeId={employee.id} />
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold leading-none">{employee.name}</p>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
                    {employee.role} · {employee.real ? 'real' : 'sim'}
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </>
          ) : (
            <ThemeToggle />
          )}
        </div>
        {employee && (
          <div className="-mt-1.5 pb-2">
            <Link
              href="/"
              className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            >
              ← Team
            </Link>
          </div>
        )}
        {/* Editorial masthead device */}
        <div className="double-rule -mt-px" aria-hidden />
      </div>
    </header>
  );
}
