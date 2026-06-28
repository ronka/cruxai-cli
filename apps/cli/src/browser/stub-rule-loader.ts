// Browser stub: rule-loader excluded from scan bundle (no fs/path/os access).
// The built-in detectors are defined as markdown rules under src/core/rules/.
// They cannot be read from disk in the browser, so esbuild bakes their sources
// into `virtual:builtin-rules` and we register them here. Without this,
// getAllRules() is empty and Anti-Patterns detects nothing.

import { registerBuiltinRuleSource } from '@crux/core/rule-engine';
// @ts-expect-error virtual module provided by esbuild builtin-rules plugin
import { BUILTIN_RULE_SOURCES } from 'virtual:builtin-rules';

let registered = false;

export function registerAllBuiltinRules(): void {
  if (registered) return;
  registered = true;
  for (const [id, source] of BUILTIN_RULE_SOURCES as [string, string][]) {
    registerBuiltinRuleSource(id, source);
  }
}

// Personal/project rules live on disk and remain unavailable in the scan report.
export function loadPersonalRules(): void { /* no-op */ }
export function registerAllBuiltinMetrics(): void { /* no-op */ }
export function getPersonalRulesDir(): string { return ''; }
export function getProjectRulesDir(_workspace: string): string { return ''; }
export function getRuleLayerInfo(_ruleId: string) { return null; }
