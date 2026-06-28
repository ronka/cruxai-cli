// Browser stub: ConfigAnalyzer excluded from scan bundle (Context Health is out of scope).
// getAntiPatterns() calls addPatternsSafely(() => getConfigHealth(...).contextAntiPatterns)
// which silently swallows errors, so returning empty is safe.

import type { DateFilter } from '@crux/core/types';
import type { ConfigHealthData } from '@crux/core/types/config-types';
import { AnalyzerBase } from '@crux/core/analyzer-base';

export class ConfigAnalyzer extends AnalyzerBase {
  // Return a complete, correctly-shaped ConfigHealthData so the Context Quality
  // tab renders a clean empty state. The real fields (notably overallScore) must
  // all be present — a missing field renders as "undefined/100" in the UI.
  getConfigHealth(_f?: DateFilter): ConfigHealthData {
    return {
      workspaces: [],
      overallScore: 0,
      agenticReadiness: { score: 0, signals: [] },
      contextProvisionByHarness: {},
      suggestions: [],
      contextAntiPatterns: [],
    };
  }

  getContextReviewPayload(_wsIds: string[]) { return { workspaces: [] }; }
}
