import type { HireRecommendation } from "@/types/analysis";

const verdictConfig: Record<HireRecommendation, { label: string; className: string }> = {
  strong: { label: "Strong Hire", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  medium: { label: "Hire", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  no_hire: { label: "No Hire", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

interface HireVerdictBadgeProps {
  recommendation: HireRecommendation | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

export function HireVerdictBadge({ recommendation, size = "md", className }: HireVerdictBadgeProps) {
  if (!recommendation) {
    return <span className="text-muted-foreground">—</span>;
  }
  const config = verdictConfig[recommendation];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span className={`inline-flex w-fit items-center rounded-full font-medium ${sizeClasses} ${config.className} ${className ?? ""}`}>
      {config.label}
    </span>
  );
}
