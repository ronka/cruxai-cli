import { cn } from "@/lib/utils";
import { flagBadgeConfig, qualityBadgeConfig } from "@/lib/analysis/badge-config";
import type { MessageInsight } from "@/server/analysisSchema";

interface InsightBadgesProps {
  insight: MessageInsight;
}

const badgeClass = "inline-flex items-center rounded-full border-0 px-2 py-0.5 text-xs font-medium";

export function InsightBadges({ insight }: InsightBadgesProps) {
  if (insight.flags.length > 0) {
    return (
      <>
        {insight.flags.map((flag) => {
          const config = flagBadgeConfig[flag];
          if (!config) return null;
          return (
            <span key={flag} className={cn(badgeClass, config.className)}>
              {config.label}
            </span>
          );
        })}
      </>
    );
  }

  const config = qualityBadgeConfig[insight.quality];
  return <span className={cn(badgeClass, config.className)}>{config.label}</span>;
}
