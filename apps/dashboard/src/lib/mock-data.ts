import type { StatsResult } from "@crux/core";

/**
 * Mock data for the starter dashboard.
 *
 * Everything here is typed against the real `@crux/core` result shapes (or a
 * documented subset of them), so swapping in live data later — from a parsed
 * `crux-report/data.json` run through the `Analyzer` — is a drop-in change with
 * no UI edits. Each field notes its `@crux/core` source.
 */

/** Straight from `@crux/core` — the Analyzer's `getStats()` output. */
export const stats: StatsResult = {
  totalSessions: 128,
  totalRequests: 1842,
  totalWorkspaces: 9,
};

/**
 * View-model that picks just the fields this overview renders, rather than
 * constructing the full ~25-field `AiCreditData` / `CodeProductionData` /
 * `FlowStateData`. Replace with values mapped from those Analyzer outputs.
 */
export interface OverviewMetrics {
  /** AiCreditData.totalCredits (USD). */
  totalCredits: number;
  /** AiCreditData.costByModel — top model by spend. */
  topModel: { name: string; share: number };
  /** CodeProductionData.aiLoc — lines written by the assistant. */
  aiLoc: number;
  /** CodeProductionData.userLoc — lines written by hand. */
  userLoc: number;
  /** FlowStateData.score (0–100). */
  flowScore: number;
  /** AiCreditData.daily.credits — recent daily spend, oldest → newest. */
  dailyCredits: number[];
}

export const overview: OverviewMetrics = {
  totalCredits: 47.32,
  topModel: { name: "claude-opus-4-8", share: 0.61 },
  aiLoc: 18420,
  userLoc: 6210,
  flowScore: 72,
  dailyCredits: [2.1, 3.4, 1.2, 4.8, 3.9, 6.2, 2.7, 5.1, 4.4, 7.3, 3.0, 4.0],
};

/** AiCreditData.costByModel, reduced to the bits the "Top models" card shows. */
export interface ModelUsage {
  name: string;
  credits: number;
  requests: number;
}

export const topModels: ModelUsage[] = [
  { name: "claude-opus-4-8", credits: 28.9, requests: 642 },
  { name: "claude-sonnet-4-6", credits: 12.1, requests: 890 },
  { name: "claude-haiku-4-5", credits: 6.32, requests: 310 },
];
