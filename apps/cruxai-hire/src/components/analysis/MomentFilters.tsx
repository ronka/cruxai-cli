'use client';

import { cn } from "@/lib/utils";
import { flagBadgeConfig, qualityBadgeConfig } from "@/lib/analysis/badge-config";
import { FLAG_TYPES, QUALITY_TYPES } from "@/lib/analysis/moment-types";
import type { MessageFlag, MessageQuality } from "@/types/analysis";

interface FilterChipProps {
  label: string;
  count: number;
  active: boolean;
  activeClassName: string;
  onClick: () => void;
}

function FilterChip({ label, count, active, activeClassName, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity",
        active ? activeClassName : "bg-muted text-muted-foreground opacity-60 hover:opacity-100",
      )}
    >
      <span>{label}</span>
      <span className="tabular-nums opacity-80">{count}</span>
    </button>
  );
}

interface MomentFiltersProps {
  flagCounts: Record<MessageFlag, number>;
  qualityCounts: Record<MessageQuality, number>;
  activeFlags: Set<MessageFlag>;
  activeQualities: Set<MessageQuality>;
  onToggleFlag: (flag: MessageFlag) => void;
  onToggleQuality: (quality: MessageQuality) => void;
}

export function MomentFilters({
  flagCounts,
  qualityCounts,
  activeFlags,
  activeQualities,
  onToggleFlag,
  onToggleQuality,
}: MomentFiltersProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {FLAG_TYPES.map((flag) => (
        <FilterChip
          key={flag}
          label={flagBadgeConfig[flag].label}
          count={flagCounts[flag]}
          active={activeFlags.has(flag)}
          activeClassName={flagBadgeConfig[flag].className}
          onClick={() => onToggleFlag(flag)}
        />
      ))}
      {QUALITY_TYPES.map((quality) => (
        <FilterChip
          key={quality}
          label={qualityBadgeConfig[quality].label}
          count={qualityCounts[quality]}
          active={activeQualities.has(quality)}
          activeClassName={qualityBadgeConfig[quality].className}
          onClick={() => onToggleQuality(quality)}
        />
      ))}
    </div>
  );
}
