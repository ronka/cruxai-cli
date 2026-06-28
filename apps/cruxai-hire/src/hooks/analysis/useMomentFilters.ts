'use client';

import { useCallback, useMemo, useState } from "react";
import { FLAG_TYPES } from "@/lib/analysis/moment-types";
import type { MessageFlag, MessageQuality } from "@/types/analysis";
import type { MessageInsight } from "@/server/analysisSchema";

export function useMomentFilters(insights: MessageInsight[]) {
  const [activeFlags, setActiveFlags] = useState<Set<MessageFlag>>(() => new Set(FLAG_TYPES));
  const [activeQualities, setActiveQualities] = useState<Set<MessageQuality>>(() => new Set());

  const toggleFlag = useCallback((flag: MessageFlag) => {
    setActiveFlags((prev) => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag);
      else next.add(flag);
      return next;
    });
  }, []);

  const toggleQuality = useCallback((quality: MessageQuality) => {
    setActiveQualities((prev) => {
      const next = new Set(prev);
      if (next.has(quality)) next.delete(quality);
      else next.add(quality);
      return next;
    });
  }, []);

  const visibleInsights = useMemo(
    () =>
      insights
        .filter((i) => {
          if (i.flags.length > 0) return i.flags.some((f) => activeFlags.has(f));
          return activeQualities.has(i.quality);
        })
        .sort((a, b) => a.messageIndex - b.messageIndex),
    [insights, activeFlags, activeQualities],
  );

  const allFiltersOff = activeFlags.size === 0 && activeQualities.size === 0;

  return {
    activeFlags,
    activeQualities,
    toggleFlag,
    toggleQuality,
    visibleInsights,
    allFiltersOff,
  };
}
