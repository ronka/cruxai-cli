import type { MessageInsight } from "@/types/analysis";
import { computeAnalysisStats } from "@/lib/analysis/stats";
import { qualityBadgeConfig, flagBadgeConfig } from "@/lib/analysis/badge-config";

interface AnalysisStatsProps {
  insights: MessageInsight[];
}

const qualityIcon = { strong: "⬆", adequate: "—", weak: "⬇" } as const;

export function AnalysisStats({ insights }: AnalysisStatsProps) {
  const { quality, flags } = computeAnalysisStats(insights);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-1">
        {(["strong", "adequate", "weak"] as const).map((q) =>
          quality[q] > 0 ? (
            <span
              key={q}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${qualityBadgeConfig[q].className}`}
            >
              {qualityIcon[q]} {quality[q]} {q}
            </span>
          ) : null
        )}
      </div>
      <div className="flex items-center gap-1">
        {(["exemplar", "red-flag", "teaching-moment"] as const).map((f) =>
          flags[f] > 0 ? (
            <span
              key={f}
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${flagBadgeConfig[f].className}`}
            >
              {flagBadgeConfig[f].label.split(" ")[0]} {flags[f]}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}
