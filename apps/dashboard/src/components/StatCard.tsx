import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  /** Short label, rendered as a monospace eyebrow to nod at the CLI origin. */
  label: string;
  /** Headline metric, set in the Literata serif display face. */
  value: number | string;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, description, className }: StatCardProps) {
  return (
    <Card className={cn("transition-colors hover:border-primary/60", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-4 font-serif text-4xl font-semibold leading-none tracking-tight tabular-nums">
          {value}
        </p>
        {description && (
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
