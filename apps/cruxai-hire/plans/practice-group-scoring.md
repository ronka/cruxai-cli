# Plan: PracticeGroup Scoring

> Generated from: /Users/ronkantor/Projects/ai-engineering-coach/PRACTICE_GROUP_SCORING.md
> Date: 2026-06-02

## Overview

Turn the `RuleFinding[]` produced by `engine.analyze(session)` into a 0–100 score per `PracticeGroup` (5 groups), one overall weighted-mean score, a letter grade/color tier, and the top contributing findings per group. Pure runtime computation over findings — no DB persistence, no cohort comparison, no history. Surfaced via a new `scoreFindings` standalone export and an `engine.score(session, opts?)` convenience on the existing engine facade, then consumed by the analysis UI as overall + per-group breakdown + radar chart.

---

## Tasks

### Task 1: Overall score end-to-end (tracer bullet)

- **Type**: AFK
- **Blocked by**: None — can start immediately
- Status: done

#### What to build

The thinnest end-to-end path through every layer: type → scoring fn → engine facade → UI.

1. Add `scope: 'requests' | 'session'` to the finding type (mirroring `rule.scope`). If the codebase currently has `RuleEvalResult` and not `RuleFinding`, introduce `RuleFinding` per PRD §5 and adapt the analyze output (or alias `RuleEvalResult` if upstream extraction is unfinished — pick whichever minimizes churn).
2. Create `src/core/scoring.ts` exporting `scoreFindings(findings, opts?)`. For this slice, return only `{ overall: number, grade: 'A'|'B'|'C'|'D'|'F' }`. Implement the formula from PRD §3:
   - `basePenalty`: high=20, medium=10, low=5
   - scope-scale: session→1.0; requests→`clamp(ratio*2, 0.25, 1.0)`
   - `groupScore = clamp(100 - Σ penalty, 0, 100)`
   - `overall = mean(groupScore for each of the 5 groups)` (equal weights)
   - grade thresholds from §4 (A 90+, B 75+, C 60+, D 40+, F <40)
3. Add `score(session, opts?)` to `RuleEngine` facade as sugar over `scoreFindings(engine.runAll(...))` (use whatever the existing analyze surface is — `runAll`).
4. Wire into the analysis view: render the overall number and letter grade somewhere visible (e.g. `78 — B`). No styling polish required yet.
5. Unit-test the PRD §6 worked example: with the listed 8 findings, overall must equal 78 (rounded) and grade `B`.

#### Acceptance criteria

- [ ] `scope` exists on the finding type and is populated by the analyze pipeline
- [ ] `scoreFindings([])` returns `{ overall: 100, grade: 'A' }`
- [ ] `scoreFindings(workedExampleFindings)` returns overall ≈ 78 with grade `B` (matches §6)
- [ ] `engine.score(session)` returns the same shape and value as `scoreFindings(engine.runAll(session))`
- [ ] Analysis view shows the overall number + letter grade for a real session
- [ ] No regressions in existing rule-engine tests

#### User stories addressed

- US: "one overall score 0–100"
- US: "letter grade for quick scan"

---

### Task 2: Per-group scores

- **Type**: AFK
- **Blocked by**: Task 1
- Status: done

#### What to build

Expand the return shape so the UI can render each group, not just the overall.

1. Extend `scoreFindings` return to `SessionScore` per PRD §5:
   ```ts
   {
     overall, grade, findingCount,
     groups: Record<PracticeGroup, GroupScore>
   }
   ```
   where `GroupScore` includes `group, score, grade, tier, weight, findingCount, totalPenalty` (defer `topContributors` and the null case to Slices 3 and 4).
2. Map `tier`: A→clean, B→minor, C→noticeable, D→bad, F→severe.
3. Update the analysis view: render the 5 groups as a list/cards under the overall, each showing group name, score, grade, and tier color (per §4 suggested palette).
4. Tests:
   - Worked-example per-group values: code-review=20/F, prompt-quality=79/B, session-hygiene=93/A, tool-mastery=100/A, context-management=100/A
   - `findingCount` and `totalPenalty` are populated correctly per group
   - `tier` matches grade

#### Acceptance criteria

- [ ] `SessionScore.groups` contains an entry for each of the 5 `PracticeGroup` values
- [ ] Each group reports `score`, `grade`, `tier`, `weight=1`, `findingCount`, `totalPenalty`
- [ ] Worked-example group values match §6 exactly
- [ ] UI renders all 5 group scores below the overall with tier-colored indicators
- [ ] Existing Task 1 tests still pass

#### User stories addressed

- US: "one score per group (5 numbers, 0–100)"
- US: "color tier for quick scan"

---

### Task 3: Top contributors per group

- **Type**: AFK
- **Blocked by**: Task 2
- Status: done

#### What to build

Surface which findings caused each group's deduction.

1. Populate `GroupScore.topContributors`: array of `{ ruleId, name, severity, penalty }`, sorted by post-scale `penalty` desc, capped at 3.
2. For an empty group, return `topContributors: []` (not null — null is reserved for Slice 4's "no rules in group" case).
3. UI: under each group card, render the top 3 contributors as the "headline issues" with severity badge and per-finding penalty number.
4. Tests:
   - Worked-example code-review group `topContributors`: vibe-coding, speed-accept, copy-paste-blindness all at penalty=20 (order among ties is stable but unspecified — assert membership + count + penalties)
   - Worked-example prompt-quality top contributor is low-constraint-usage at penalty=10
   - Cap at 3 even when 5+ findings exist in a group

#### Acceptance criteria

- [ ] `topContributors` is sorted by `penalty` desc and length ≤ 3
- [ ] Each entry contains `ruleId, name, severity, penalty` (post-scale)
- [ ] UI renders the top 3 per group with severity badge + penalty
- [ ] Groups with zero findings render no contributors (UI shows "no issues" copy, not an empty list)

#### User stories addressed

- US: "which findings drove the deduction, ordered by impact"

---

### Task 4: Null-group handling

- **Type**: AFK
- **Blocked by**: Task 2
- Status: done

#### What to build

A group with zero rules registered isn't an A — it's "n/a". Required so an extension that ships e.g. only `code-review` and `prompt-quality` rules doesn't show three misleading green 100s.

1. Change `GroupScore.score` and `.grade` types to `number | null` / `Grade | null` per PRD §7.
2. Detect the empty-group case from `engine.getRules()` (rules registered for that group, not findings — a group with rules but no firings is still a legitimate 100/A).
3. Overall weighted mean excludes null groups from both numerator and denominator (PRD §7): `Σ(weight×score for non-null) / Σ(weight for non-null)`.
4. UI: render `—` / `n/a` (no tier color) for null groups; radar/list still shows the axis with a muted state.
5. Tests:
   - Engine with rules only in `code-review` + `prompt-quality`: other 3 groups return `score: null, grade: null`
   - Overall is computed only over the 2 scoring groups
   - Defensive: a finding with an unknown `group` is skipped with a warn (PRD §9)

#### Acceptance criteria

- [ ] Groups with zero registered rules return `score: null` and `grade: null`
- [ ] Overall weighted mean denominator excludes null groups
- [ ] UI renders "—" (no color) for null-scored groups
- [ ] Unknown-group findings are skipped without crashing and log a warn
- [ ] Worked-example values from §6 still match (all 5 groups have rules in that example)

#### User stories addressed

- US: §7 "don't show empty groups as 100 / A"
- US: §9 defensive edge cases

---

### Task 5: Tuning knobs (`ScoringOptions`)

- **Type**: AFK
- **Blocked by**: Task 1
- Status: done

#### What to build

Expose the consumer escape hatches from PRD §8 without re-shaping the public API.

1. Add `ScoringOptions` parameter to `scoreFindings` and `engine.score`:
   ```ts
   {
     groupWeights?: Partial<Record<PracticeGroup, number>>;
     severityPenalties?: { high?: number; medium?: number; low?: number };
     scopeScale?: { slope?: number; floor?: number };
   }
   ```
2. Defaults stay exactly as PRD §3 (high=20, medium=10, low=5; slope=2, floor=0.25; weight=1.0).
3. Effective per-group weight surfaces in `GroupScore.weight`.
4. Tests:
   - `severityPenalties.high: 15` lowers code-review penalty to 60 → score 40 (vs §6's 20)
   - `groupWeights: { 'code-review': 2 }` lowers worked-example overall (since the worst group gets double weight)
   - `scopeScale.slope: 1` makes lazy-prompting (ratio 0.44) penalty 4.4 instead of 8.8
   - `scopeScale.floor: 0.5` raises frustration-signals (ratio 0.11) penalty to 5.0
   - Unrecognized `groupWeights` keys for groups with zero rules are silently ignored (PRD §9)

#### Acceptance criteria

- [ ] All three option groups are recognized; missing fields fall back to defaults
- [ ] Worked-example output is identical when `opts` is undefined or `{}`
- [ ] Each override scenario above produces the expected delta
- [ ] `GroupScore.weight` reflects the resolved (overridden or default) weight

#### User stories addressed

- US: "consumer overrides weights/penalties without touching rules"

---

### Task 6: Radar chart visualization

- **Type**: AFK
- **Blocked by**: Task 2
- Status: done

#### What to build

PRD §7's "one UI rule" — show the radar of group scores so the failure mode is visible at a glance.

1. Replace (or supplement) the per-group list in the analysis view with a 5-axis radar chart: one axis per `PracticeGroup`, value = `score` (treat null as 0 visually with a muted axis label, or omit the axis once Slice 4 lands).
2. Color the filled area by overall tier; render axis tick at 90 as the "A target band" so users see where they sit relative to the goal.
3. Phrasing: "your session scored 78 — A range is 90+" rather than any percentile/cohort language (PRD §7).
4. Keep the top-contributors list (from Slice 3) underneath the radar.
5. Smoke test in the dev UI with a real analyzed session.

#### Acceptance criteria

- [ ] Radar chart renders with 5 axes labeled by group name
- [ ] Filled area is colored by overall tier (PRD §4 palette)
- [ ] Target-band line at 90 is visible
- [ ] Score-vs-target phrasing is present, no cohort/percentile copy
- [ ] Works in the actual analysis view with a real session

#### User stories addressed

- US: §7 "radar chart makes the failure mode obvious in one glance"
- US: §7 "compare to target band, not a benchmark"

---

### Task 7: README + defaults documentation

- **Type**: AFK
- **Blocked by**: Task 5
- Status: done

#### What to build

Implementation checklist item 7 from PRD §11: document the defaults so consumers know which knob solves which problem.

1. Add a "Scoring" section to the engine package README covering:
   - The formula summary from PRD §3 and §TL;DR
   - Grade thresholds from §4
   - The full tuning-knobs table from §8 (default + when to override)
   - A short worked example referencing §6
2. Note the empty-group null behavior (§7) and the §9 edge cases.
3. Explicitly call out that score is runtime-computed from findings, not persisted, and that re-scoring from persisted findings is the supported way to retune without re-detecting.

#### Acceptance criteria

- [ ] README "Scoring" section exists with formula, thresholds, and the §8 knobs table
- [ ] Defaults match the implementation
- [ ] Re-scoring-from-persisted-findings workflow is documented
- [ ] Null-group and edge-case behavior is mentioned

#### User stories addressed

- US: implementation checklist item 7 (documentation)
