// Browser stub: ConfigAnalyzer excluded from scan bundle (Context Health is out of scope).
// getAntiPatterns() calls addPatternsSafely(() => getConfigHealth(...).contextAntiPatterns)
// which silently swallows errors, so returning empty is safe.

import type { DateFilter } from '../../core/types';
import { AnalyzerBase } from '../../core/analyzer-base';

export class ConfigAnalyzer extends AnalyzerBase {
  getConfigHealth(_f?: DateFilter) {
    return {
      workspaces: [],
      totalWorkspaces: 0,
      scoredWorkspaces: 0,
      hasPersonalSkills: false,
      personalSkillCount: 0,
      contextAntiPatterns: [],
      contextProvisionByHarness: [],
      agenticReadiness: {
        score: 0,
        signals: [],
        hasGlobalMcpServers: false,
        hasGlobalSkills: false,
        hasGlobalInstructions: false,
      },
    };
  }

  getContextReviewPayload(_wsIds: string[]) { return { workspaces: [] }; }
}
