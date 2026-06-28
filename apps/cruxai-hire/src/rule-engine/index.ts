import type { Rule, RuleFinding, Session, RuleEngine, RuleEngineOptions } from './types';
import { scoreFindings } from './scoring';

export function createRuleEngine(opts: RuleEngineOptions): RuleEngine {
  const { rules, logger } = opts;
  const seen = new Set<string>();
  for (const r of rules) {
    if (seen.has(r.id)) throw new Error(`Duplicate rule id: ${r.id}`);
    seen.add(r.id);
  }

  function runOne(rule: Rule, session: Session): RuleFinding | null {
    try {
      return rule.detect(session, rule);
    } catch (e) {
      logger?.warn(`Rule ${rule.id} threw: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  }

  return {
    getRules() { return rules; },
    analyze(session: Session): RuleFinding[] {
      const findings: RuleFinding[] = [];
      for (const rule of rules) {
        const f = runOne(rule, session);
        if (f) findings.push(f);
      }
      return findings;
    },
    analyzeOne(session: Session, ruleId: string): RuleFinding | null {
      const rule = rules.find(r => r.id === ruleId);
      return rule ? runOne(rule, session) : null;
    },
    score(session: Session, opts) {
      const registeredGroups = Array.from(new Set(rules.map(r => r.group)));
      return scoreFindings(this.analyze(session), { registeredGroups, logger, ...opts });
    },
  };
}
