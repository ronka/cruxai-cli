'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SUB_ROUTES = [
  { segment: '', label: 'Dashboard' },
  { segment: '/timeline', label: 'Timeline' },
  { segment: '/patterns', label: 'Patterns' },
  { segment: '/anti-patterns', label: 'Anti-Patterns' },
] as const;

export function NavLinks({ employeeId }: { employeeId: string }) {
  const pathname = usePathname();
  const base = `/employee/${employeeId}`;

  return (
    <nav className="flex items-center gap-1">
      {SUB_ROUTES.map(({ segment, label }) => {
        const href = `${base}${segment}`;
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={[
              'font-mono text-[0.7rem] uppercase tracking-[0.14em] px-3 py-1.5 rounded-md transition-colors',
              active
                ? 'bg-accent/20 text-accent-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            ].join(' ')}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
