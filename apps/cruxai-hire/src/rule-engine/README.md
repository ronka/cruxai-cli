# Rule Engine

Detection pipeline that turns a `Session` into `RuleFinding[]`, plus a scoring
module that rolls those findings up into 0–100 scores per `PracticeGroup`.

## Scoring

### Formula

```
basePenalty(severity)  = { high: 20, medium: 10, low: 5 }
scopeScale(finding)    = finding.scope === 'session'  → 1.0
                       = finding.scope === 'requests' → clamp(ratio × 2, 0.25, 1.0)
penalty(finding)       = basePenalty(severity) × scopeScale(finding)

groupScore(g)          = clamp(100 − Σ penalty(f) for f.group === g, 0, 100)
overall                = Σ (weight(g) × groupScore(g)) / Σ weight(g)
                          across groups whose score is non-null
```

### Grade thresholds

| Score    | Grade | Tier        | Color  |
|----------|-------|-------------|--------|
| 90–100   | A     | clean       | green  |
| 75–89    | B     | minor       | lime   |
| 60–74    | C     | noticeable  | amber  |
| 40–59    | D     | bad         | orange |
| 0–39     | F     | severe      | red    |

### Tuning knobs (`ScoringOptions`)

| Knob | Default | When to override |
|------|---------|------------------|
| `severityPenalties.high`   | 20 | Lower to 15 if F should require ≥4 high findings instead of ≥2 |
| `severityPenalties.medium` | 10 | Raise to 12 if medium findings feel under-weighted in your domain |
| `severityPenalties.low`    | 5  | Usually leave alone — lows are background noise |
| `scopeScale.slope`         | 2  | Raise to 3 to penalize moderate-ratio findings harder; lower to 1 for linear |
| `scopeScale.floor`         | 0.25 | Raise to 0.5 if "any fire = serious"; lower to 0.1 to soften long-tail signals |
| `groupWeights[g]`          | 1.0 | Raise `code-review` to 2.0 for security-focused products, etc. |
| `registeredGroups`         | all 5 | Groups absent here score `null` (n/a). `engine.score(session)` fills this from `getRules()`. |

### Worked example (PRD §6)

A 45-minute vibe-coding session with 4 high `code-review` findings (mostly
session-scope), 3 medium `prompt-quality` findings, and 1 high
`session-hygiene` finding at 17% ratio produces:

| Group              | Score | Grade |
|--------------------|-------|-------|
| code-review        | 20    | F     |
| prompt-quality     | 79    | B     |
| session-hygiene    | 93    | A     |
| tool-mastery       | 100   | A     |
| context-management | 100   | A     |

Overall (equal weights): **78 — B**.

See `__tests__/scoring.test.ts` for the executable version.

### Null-group handling

A group with zero rules registered scores `null` (not 100/A). The overall
weighted mean excludes null groups from both numerator and denominator.
Findings whose `group` isn't one of the five known groups are skipped with
a logger warning and don't crash the scorer (forward-compat for future
groups).

### Re-scoring from persisted findings

Score is runtime-computed, not persisted. To retune weights or penalties
without re-running detection, call `scoreFindings(findings, opts)` directly
on a stored `RuleFinding[]` snapshot — no `Session` or engine instance is
required. This is the supported workflow for experimenting with knobs.
