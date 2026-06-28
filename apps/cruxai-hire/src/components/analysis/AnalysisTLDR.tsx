'use client';

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MomentFilters } from "@/components/analysis/MomentFilters";
import { MomentRow } from "@/components/analysis/MomentRow";
import { useMomentFilters } from "@/hooks/analysis/useMomentFilters";
import { computeMomentCounts } from "@/lib/analysis/stats";
import type { StoredMessage } from "@/types/stored-message";
import type { MessageInsight } from "@/server/analysisSchema";

interface AnalysisTLDRProps {
  messages: StoredMessage[];
  messageInsights: MessageInsight[];
  onJumpToMessage?: (timelineIndex: number) => void;
}

export function AnalysisTLDR({ messages, messageInsights, onJumpToMessage }: AnalysisTLDRProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const counts = useMemo(() => computeMomentCounts(messageInsights), [messageInsights]);
  const {
    activeFlags,
    activeQualities,
    toggleFlag,
    toggleQuality,
    visibleInsights,
    allFiltersOff,
  } = useMomentFilters(messageInsights);

  const toggleRow = (messageIndex: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(messageIndex)) next.delete(messageIndex);
      else next.add(messageIndex);
      return next;
    });
  };

  const totalMoments =
    Object.values(counts.flags).reduce((a, b) => a + b, 0) +
    Object.values(counts.quality).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span>Moments</span>
          <span className="text-xs text-muted-foreground font-normal tabular-nums">
            {visibleInsights.length} / {totalMoments}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MomentFilters
          flagCounts={counts.flags}
          qualityCounts={counts.quality}
          activeFlags={activeFlags}
          activeQualities={activeQualities}
          onToggleFlag={toggleFlag}
          onToggleQuality={toggleQuality}
        />
        {visibleInsights.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            {allFiltersOff
              ? "Select a category above to view moments."
              : "No moments match the current filters."}
          </div>
        ) : (
          <div className="space-y-1">
            {visibleInsights.map((insight) => (
              <MomentRow
                key={insight.messageIndex}
                insight={insight}
                message={messages[insight.messageIndex]}
                isExpanded={expandedRows.has(insight.messageIndex)}
                onToggle={() => toggleRow(insight.messageIndex)}
                onJumpToMessage={onJumpToMessage ? () => onJumpToMessage(insight.messageIndex) : undefined}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
