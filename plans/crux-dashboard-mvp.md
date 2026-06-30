# Plan: Crux Dashboard MVP (single-user)

> Generated from: conversation (grill-with-docs session, 2026-06-30)
> Date: 2026-06-30
> Context: [apps/dashboard/CONTEXT.md](../apps/dashboard/CONTEXT.md) · ADR: [0001-dashboard-consumes-data-json.md](../apps/dashboard/docs/adr/0001-dashboard-consumes-data-json.md)

## Overview

Build the MVP of the `@crux/dashboard` Next.js app: a flat, single-user (anonymous)
analytics dashboard with four routes — Dashboard, Timeline, Patterns, Anti-Patterns.
It reads the `data.json` that `crux scan` writes (server-side `fs`, path from
`CRUX_REPORT` env, default `./crux-report/data.json`), rehydrates it, and runs the
`@crux/core` `Analyzer` to render all-time aggregates (no filters), with Chart.js
visuals matching the offline report, in the existing crux dashboard style
(serif/mono/grain/double-rule, light+dark). The end-state — many employees grouped by
role, fed from a shared bucket — only swaps the *source* of `data.json` later; it is
explicitly out of scope here.

---

## Tasks

### Task 1: Server-side data spine

Status: done

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

The tracer bullet that proves the whole pipeline end to end. Add a server-side loader
(e.g. `apps/dashboard/src/lib/load-report.ts`) that reads `data.json` from disk
(`process.env.CRUX_REPORT` falling back to `./crux-report/data.json`), rehydrates the
serialized Maps (`editLocIndex`, `workspaces`) the same way the offline report's
`analyzer-entry.ts` does, and constructs a `@crux/core` `Analyzer`. Call it from the
overview Server Component (`app/page.tsx`) and replace the mock `stats` values in the
existing stat cards with real `analyzer.getStats()` output. Handle the missing-file
case with a clear message rather than a crash.

#### Acceptance criteria

- [x] `load-report.ts` reads the path from `CRUX_REPORT` env, default `./crux-report/data.json`
- [x] Maps are rehydrated and a working `Analyzer` is constructed server-side (no fs/worker errors)
- [x] Overview stat cards (at least Sessions / Requests / Workspaces) show real values from `getStats()`
- [x] A missing or unreadable `data.json` renders a friendly empty/error state, not a 500 stack trace
- [x] No mock data remains behind the stat cards that this task wires

#### User stories addressed

- Load the same `data.json` that `crux scan` produces
- See real session analytics in the crux dashboard style

---

### Task 2: Overview page complete (deterministic, non-chart, non-rule)

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Wire the remaining deterministic overview sections to real Analyzer output: top models
and top languages, plus the AI-credits / code-production figures the overview shows
(`getAiCredits`, `getCodeProduction`, and the LoC/AI-ratio derived values). Remove the
corresponding mock-data usage. Excludes the Daily Activity chart (Task 3) and the
anti-pattern summary cards (Task 5), which land in their own slices.

#### Acceptance criteria

- [x] Top models card renders from real `getAiCredits()` cost-by-model data
- [x] Top languages / AI-written-LOC figures render from real `getCodeProduction()` data
- [x] AI-credits headline figure(s) render from real Analyzer output
- [x] `mock-data.ts` is no longer imported for any wired-up overview section
- [x] Page renders correctly against the committed sample `data.json`

#### User stories addressed

- See a real overview of spend, models, and code produced

---

### Task 3: Chart.js Daily Activity chart

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Introduce the shared charting pattern. Add `chart.js` as a dashboard dependency and a
small client-component `<Chart>` wrapper (`'use client'`) styled to the crux theme.
Render the overview's Daily Activity chart with metric tabs (Requests / Sessions / LoC /
Workspaces) from `getDailyActivity()`, matching the offline report's look. This wrapper
is the reusable primitive Task 4 (Timeline) builds on.

#### Acceptance criteria

- [x] `chart.js` added to `apps/dashboard/package.json`; bundle builds cleanly
- [x] Reusable `<Chart>` client component renders inside the server-rendered overview
- [x] Daily Activity shows real `getDailyActivity()` data with working metric tabs
- [x] Chart respects light/dark theme and the crux palette
- [x] Visual result is recognizably close to the offline report's Daily Activity chart

#### User stories addressed

- See daily activity trends, matching the offline report

---

### Task 4: App shell + Timeline route

Status: done

- **Type**: AFK
- **Blocked by**: Task 1, Task 3

#### What to build

Make the app multi-page. Add route navigation to the layout/Header (Dashboard,
Timeline, Patterns, Anti-Patterns), with active-route styling in the crux look. Build
the `/timeline` route as a Server Component using the shared loader, rendering
chronological activity via `getDailyActivity()` / `getDayTimeline()` (and related
timeline methods) through the Task 3 `<Chart>` wrapper.

#### Acceptance criteria

- [x] Layout shows nav for all four routes with active-state styling
- [x] `/timeline` renders real timeline data from the Analyzer
- [x] Timeline charts reuse the Task 3 `<Chart>` wrapper (no duplicate charting code)
- [x] Navigating between `/` and `/timeline` works and preserves the dashboard chrome

#### User stories addressed

- Navigate between dashboard sections
- See activity over time (Timeline)

---

### Task 5: Built-in rule registration + Anti-Patterns route

Status: done

- **Type**: AFK
- **Blocked by**: Task 1, Task 4

#### What to build

Unlock the rule-driven pages. Add a server-side step that reads the built-in rule
markdown from `packages/core/src/rules/*.md` and calls `registerBuiltinRuleSource(...)`
before analytics run (the dashboard's equivalent of the CLI's fs path / browser virtual
module). Build the `/anti-patterns` route via `getAntiPatterns()`, and add the
anti-pattern summary cards to the overview page. Personal/project rules remain out of
scope (built-in only).

#### Acceptance criteria

- [x] Built-in rules from `packages/core/src/rules/*.md` are registered server-side once per request/build
- [x] `/anti-patterns` renders real findings/scores from `getAntiPatterns()` (non-empty against sample data)
- [x] Overview shows anti-pattern summary cards consistent with the Anti-Patterns page
- [x] Rule registration is factored so Task 6 can reuse it
- [x] No reliance on personal/project rules or the trust flow

#### User stories addressed

- See detected anti-patterns and scores

---

### Task 6: Patterns route

Status: done

- **Type**: AFK
- **Blocked by**: Task 5

#### What to build

Build the `/patterns` route using the rule registration from Task 5. Run
`runDetectors()` / `runEmitters()` and `getAllRules()` to surface positive practice
detections, mapped into the crux dashboard style. This is the one route without a single
clean Analyzer method, so it carries the detector glue.

#### Acceptance criteria

- [x] `/patterns` renders real positive-practice detections against the sample data
- [x] Reuses Task 5's built-in rule registration (no duplicate rule-loading code)
- [x] Page matches the crux dashboard style and the established nav
- [x] All four MVP routes (Dashboard, Timeline, Patterns, Anti-Patterns) are reachable and render real data

#### User stories addressed

- See detected good practices (Patterns)

---

## Out of scope (post-MVP)

- Filters (date range / workspace / harness) — the offline report already covers deep filtering
- Skill Finder and any LLM-gated UI (needs an API key)
- Output, Context Health, Image Gallery routes
- Multi-employee roster, Role classification, identity chrome — arrives with the upload/identity layer
- Shared-bucket data source (swaps only the source of `data.json`, per ADR 0001)
- Deployment — MVP runs locally via `nx dev dashboard`
