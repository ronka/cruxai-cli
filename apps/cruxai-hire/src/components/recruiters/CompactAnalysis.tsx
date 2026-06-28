import type { AnalysisResult, HireRecommendation, MessageFlag } from "@/types/analysis";
import { HireVerdictBadge } from "@/components/analysis/HireVerdictBadge";
import { flagCounterEmoji } from "@/lib/analysis/badge-config";

interface CompactAnalysisProps {
  analysisResult: AnalysisResult | null | undefined;
  hireRecommendation: HireRecommendation | null | undefined;
}

export function CompactAnalysis({ analysisResult, hireRecommendation }: CompactAnalysisProps) {
  const insights = analysisResult?.messageInsights ?? [];
  const flagCounts: Record<MessageFlag, number> = { exemplar: 0, "red-flag": 0, "teaching-moment": 0 };
  for (const insight of insights) {
    for (const flag of insight.flags ?? []) {
      if (flag in flagCounts) flagCounts[flag]++;
    }
  }

  if (!hireRecommendation && !analysisResult) {
    return <span className="text-muted-foreground">—</span>;
  }

  const hasFlagCounts = (Object.keys(flagCounts) as MessageFlag[]).some((f) => flagCounts[f] > 0);

  return (
    <div className="flex flex-col gap-1">
      <HireVerdictBadge recommendation={hireRecommendation} size="sm" />
      {hasFlagCounts && (
        <div className="flex items-center gap-1">
          {(["exemplar", "red-flag", "teaching-moment"] as const).map((f) =>
            flagCounts[f] > 0 ? (
              <span key={f} className="text-xs text-muted-foreground">
                {flagCounterEmoji[f]}
                {flagCounts[f]}
              </span>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
