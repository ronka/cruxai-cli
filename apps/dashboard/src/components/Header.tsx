import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl font-semibold tracking-tight">crux</span>
            <span className="hidden font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground sm:inline">
              usage&nbsp;report
            </span>
          </div>
          <ThemeToggle />
        </div>
        {/* Editorial masthead device borrowed from cruxai-hire */}
        <div className="double-rule -mt-px" aria-hidden />
      </div>
    </header>
  );
}
