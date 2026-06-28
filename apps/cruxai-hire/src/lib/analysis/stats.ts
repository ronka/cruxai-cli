import type { MessageInsight, MessageFlag, MessageQuality } from "@/types/analysis";

export interface AnalysisStatsCounts {
  quality: Record<MessageQuality, number>;
  flags: Record<MessageFlag, number>;
}

export function computeAnalysisStats(insights: MessageInsight[]): AnalysisStatsCounts {
  const quality: Record<MessageQuality, number> = { strong: 0, adequate: 0, weak: 0 };
  const flags: Record<MessageFlag, number> = { exemplar: 0, "red-flag": 0, "teaching-moment": 0 };
  for (const i of insights) {
    if (i.quality in quality) quality[i.quality]++;
    for (const f of i.flags ?? []) {
      if (f in flags) flags[f]++;
    }
  }
  return { quality, flags };
}

// Counts that mirror what MomentFilters governs: quality counts only include
// insights with no flag, since flagged rows are filtered via flag chips.
export function computeMomentCounts(insights: MessageInsight[]): AnalysisStatsCounts {
  const quality: Record<MessageQuality, number> = { strong: 0, adequate: 0, weak: 0 };
  const flags: Record<MessageFlag, number> = { exemplar: 0, "red-flag": 0, "teaching-moment": 0 };
  for (const i of insights) {
    if (i.flags.length > 0) {
      for (const f of i.flags) {
        if (f in flags) flags[f]++;
      }
    } else if (i.quality in quality) {
      quality[i.quality]++;
    }
  }
  return { quality, flags };
}
