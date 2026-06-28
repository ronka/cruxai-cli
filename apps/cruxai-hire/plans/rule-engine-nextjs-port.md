# Plan: Rule Engine in a Next.js App

> Generated from: `RULE_ENGINE_NEXTJS_DESIGN.md` (source rules: `/Users/ronkantor/Projects/ai-engineering-coach`)
> Date: 2026-06-02

## Overview

Port the ai-engineering-coach rule engine into cruxai as a single-session, TypeScript-first module. Rules live in `src/rules/rules.ts` as a typed `Rule[]` — no JSON, no markdown loader, no build step. The engine exposes `createRuleEngine({ rules }) → { getRules, analyze, analyzeOne }`. Strip all multi-session machinery (sampling guards, `scope: 'sessions' | 'both'`, overrides, overlays, hot-reload). Surface findings to the app through a tRPC procedure (per CLAUDE.md, all data fetching goes through tRPC).

Source references: engine code at `ai-engineering-coach/src/core/{rule-engine,detectors,detector-registry,dsl/*}.ts`; rule markdown at `ai-engineering-coach/src/core/rules/*.md`.

---

## Tasks

### Task 1: Engine skeleton + tracer bullet through tRPC

Status: done

- **Type**: AFK
- **Blocked by**: None — can start immediately

#### What to build

A minimal end-to-end path: types module, a stub `createRuleEngine` that returns findings for one trivial always-fires rule, the server-only singleton, a tRPC procedure that calls `engine.analyze(session)`, and a small client hook + demo surface that posts a fixture session and renders findings.

- `src/rule-engine/types.ts` — `Rule`, `RuleSeverity`, `RuleScope`, `PracticeGroup`, `Session`, `SessionRequest`, `RuleFinding` (PRD §2, §4)
- `src/rule-engine/index.ts` — `createRuleEngine({ rules })` returning `{ getRules, analyze, analyzeOne }`. `analyze` for now just emits a finding per rule whose `id === 'always-fires'`.
- `src/lib/rule-engine.server.ts` — `import 'server-only'`; exports `engine` singleton built from `src/rules/rules.ts`.
- `src/rules/rules.ts` — exports `rules: Rule[]` containing the one stub rule.
- `src/server/trpc/routers/rules.ts` — new router with `analyze` mutation (`input: SessionSchema`, returns `RuleFinding[]`). Register in `_app.ts`.
- `src/hooks/api/rules.ts` — `useAnalyzeSessionMutation` via `useTRPCClient`.
- A demo page or storybook-like route that posts a hardcoded fixture and lists findings.

No DSL, no real rules — this slice proves the loading story and the wire.

#### Acceptance criteria

- [ ] `src/rule-engine/types.ts` matches the PRD §2 and §4 shapes exactly
- [ ] `createRuleEngine({ rules })` returns a `RuleEngine` matching PRD §3
- [ ] `src/lib/rule-engine.server.ts` carries `import 'server-only'` and exports a singleton
- [ ] tRPC `rules.analyze` procedure exists and is registered in `_app.ts`
- [ ] `useAnalyzeSessionMutation` returns `RuleFinding[]` for a fixture session
- [ ] Demo surface renders the trivial finding round-tripped through tRPC

#### User stories addressed

- PRD §1 (the whole picture)
- PRD §3 (engine API surface)
- PRD §8 (app layout)

---

### Task 2: DSL port + `scope: 'requests'` pipeline

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Lift the DSL stack (`lexer`, `parser`, `interpreter`, `safe-regex`, `schema`, `types`, `index`) from `ai-engineering-coach/src/core/dsl/*` into `src/rule-engine/dsl/`. Implement the pipeline executor for `scope: 'requests'`: scan over `session.requests`, evaluate `match:` per request, aggregate `count | ratio`, evaluate `check:`, render `examples:`. Build the template engine for `{{count}}`, `{{total}}`, `{{ratio}}`, `{{pct}}`, `{{extra.X}}`, `{{thresholds.X}}`, and pipe filters like `| truncate:N`. Port `lazy-prompting.md` as the canary `Rule` object.

Strip from the source: multi-session helpers (`weeklyHist`, `addWorkspaceDetails`, `parseIsoWeek`), `scope: 'sessions' | 'both'` branches, `overrides`, `RuleStore`, the registry Proxy.

#### Acceptance criteria

- [ ] DSL parses and interprets a `requests`-scoped pipeline against a `Session` fixture
- [ ] `safe-regex` rejects catastrophic patterns (port existing tests)
- [ ] `analyze(session)` fires `lazy-prompting` when ≥ `maxRatio` of requests are under `minChars`
- [ ] Template engine substitutes the documented placeholders and supports `| truncate:N`
- [ ] `examples` array contains up to 3 rendered per-occurrence strings
- [ ] No `minSample` / `minSessions` / `minOccurrences` in the executor or the ported rule

#### User stories addressed

- PRD §3 (engine API — `analyze`)
- PRD §6 (DSL directives)
- PRD §10 (what's gone)

---

### Task 3: `scope: 'session'` + reducer-driven `extra.*`

Status: done

- **Type**: AFK
- **Blocked by**: Task 2

#### What to build

Add the session-scope branch to the pipeline: one row (the session), `total = 1`, `match:` evaluated once. Any non-reserved DSL key (anything outside `scan|match|aggregate|check|examples|severity`) becomes a reducer that emits to `extra.<name>`, available to `check:` and all templates. Port `vibe-coding.md` as the canary — it uses `aiLoc: sum(requests.aiCode.loc)` and `userPrompts: count(requests)` reducers.

#### Acceptance criteria

- [ ] `scope: 'session'` evaluates the pipeline once against the session-shaped row
- [ ] Reducer keys appear as `extra.<name>` in `check:` expressions and templates
- [ ] `vibe-coding` fires on a session with `aiLoc ≥ 100` and `userPrompts ≤ 5`
- [ ] `vibe-coding` does NOT fire below thresholds
- [ ] `sum(requests.aiCode.loc)` and `count(requests)` reducers work over `SessionRequest[]`

#### User stories addressed

- PRD §5 (single-session semantics)
- PRD §6 (reducer-emitted `extra.*`)

---

### Task 4: Dynamic severity + `extends` inheritance

Status: done

- **Type**: AFK
- **Blocked by**: Task 3

#### What to build

Two small features that complete the §10 "what stays" list:

- `severity:` reducer in the DSL — when present, its evaluated value (`'high' | 'medium' | 'low'`) overrides the rule's declared severity on the emitted finding.
- `resolveInheritance(rules)` — applied inside `createRuleEngine` before storing rules. If a rule has `extends: 'parent-id'`, its fields override the parent's; thresholds, patterns, and fileTypes are shallow-merged.

#### Acceptance criteria

- [ ] A rule with a `severity:` DSL line emits findings whose severity reflects the evaluated expression
- [ ] A rule with `extends` inherits all unspecified fields from its parent
- [ ] `thresholds`, `patterns`, `fileTypes` are merged (child wins per key)
- [ ] Cycles in `extends` are detected and logged via the engine `logger`
- [ ] `getRules()` returns resolved (post-inheritance) rules

#### User stories addressed

- PRD §2 (`extends`)
- PRD §10 (dynamic severity, inheritance kept)

---

### Task 5: Port bundled rules from `ai-engineering-coach/src/core/rules/*.md`

Status: done

- **Type**: AFK
- **Blocked by**: Task 4

#### What to build

Hand-convert each markdown rule under `/Users/ronkantor/Projects/ai-engineering-coach/src/core/rules/*.md` into a typed `Rule` object in `src/rules/rules.ts`. For each:

- Map frontmatter fields to the `Rule` shape (PRD §2)
- Strip every `minSession` / `minSample` / `minOccurrences` threshold and any `check:` guard that references them
- Rewrite any `scope: 'sessions' | 'both'` to `scope: 'session'` (single-session semantics), removing cross-session aggregation
- Set `requiresIdeContext: true` for rules that read `hasDevcontainer` / `customInstructionsBytes` / IDE-only request fields
- Group naming should match `PracticeGroup` enum

Curate the final set (PRD §11 step 5 mentions 12-17 rules) — drop any rule whose detection is inherently cross-session and not salvageable. Document drops in a comment in `rules.ts`.

#### Acceptance criteria

- [ ] `src/rules/rules.ts` exports a typed `Rule[]` that type-checks
- [ ] No remaining `minSample` / `minSessions` / `minOccurrences` references in `rules.ts`
- [ ] No `scope: 'sessions'` or `scope: 'both'` values
- [ ] Each ported rule has `description`, `descriptionTemplate`, `suggestionTemplate`, `exampleTemplate`, `detectionLogic`
- [ ] `engine.analyze(session)` runs against a representative fixture and produces findings for at least three different rules
- [ ] Rules requiring IDE-only fields are gated by `requiresIdeContext: true`

#### User stories addressed

- PRD §5 (deguarded rules)
- PRD §11 step 5 (port bundled rules)

---

### Task 6: Wire engine into cruxai's real session source

Status: done

- **Type**: AFK
- **Blocked by**: Task 5

#### Decisions made

- **Findings are computed on demand** — no `rule_findings` table, no DB migrations. Each call to `rules.analyze` recomputes findings from the live session data and returns them to the caller. Nothing is persisted.
- **No database changes** in this task or any task in this plan.

#### What to build

- Build a server-side adapter that maps cruxai's existing session/candidate data (read-only) → `Session` / `SessionRequest`
- Add a tRPC query (or extend `rules.analyze`) that resolves a session by id, adapts it, runs the engine, and returns findings
- Surface findings in the relevant UI surface (analysis page, candidate detail, etc.)
- Pass `skipIdeContextRules: true` if the session source lacks IDE-context fields

#### Acceptance criteria

- [ ] Adapter reads cruxai's existing DB data (read-only, no schema changes) and produces `Session` objects matching the engine's expected shape
- [ ] A real cruxai session round-trips through the engine and produces findings
- [ ] Findings are returned live per request — not stored in DB
- [ ] Findings are rendered in the chosen UI surface
- [ ] `skipIdeContextRules` policy is set explicitly (true or false, with rationale)

#### User stories addressed

- PRD §8 (app layout in production)
- PRD §1 (end-to-end loading story, on real data)

---

### Task 7: Streaming `analyzeOne` Server Action (optional)

Status: done

- **Type**: AFK
- **Blocked by**: Task 5

#### What to build

Add the streaming surface from PRD §9 for progressive UI:

- `engine.analyzeOne(session, ruleId)` is already present from Task 1; ensure it shares the same pipeline executor as `analyze`
- Server Action `analyzeStreaming(session)` that `yield`s each `RuleFinding` as it becomes available, iterating `engine.getRules()` and calling `analyzeOne`
- A client consumer that renders findings as they stream in (e.g., on the analysis page)
- `runtime: 'nodejs'` + `dynamic: 'force-dynamic'` on any route that hosts this

#### Acceptance criteria

- [ ] `analyzeOne(session, ruleId)` returns the same finding as the equivalent slice of `analyze(session)` would
- [ ] `analyzeStreaming` is an `async function*` Server Action and yields findings progressively
- [ ] A client surface renders findings as they arrive (not after all complete)
- [ ] Route configuration includes `runtime: 'nodejs'` and `dynamic: 'force-dynamic'`

#### User stories addressed

- PRD §9 (streaming Server Action)
- PRD §11 step 8

---
