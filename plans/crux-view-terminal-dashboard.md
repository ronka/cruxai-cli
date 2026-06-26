# Plan: crux view — In-Terminal Dashboard

> Generated from: conversation
> Date: 2026-06-26

## Overview

After running `./bin/run scan` without `--open`, the user wants to view the dashboard
*inside the terminal* instead of opening the HTML report in a browser. This adds a single
new command, `crux view [section]`, that reads the already-written `./crux-report/data.json`
from the last scan (instant; reparse-logs fallback if absent) and prints dashboard sections
as dependency-free ANSI text using the existing `src/cli/render/term.ts` helpers (tables,
util bars, sparklines, colors). No new packages are introduced. Section dispatch mirrors the
HTML dashboard's tabs (`src/webview/app.ts`) by reusing `Analyzer.get*()` methods, following
the same pattern already established by `crux context-health` and `crux skills`.

Settled decisions: single `view` command with a positional `section` argument (default
`overview`, `all` prints everything); data is loaded from scan output with a reparse fallback.

---

## Tasks

### Task 1: `view` command skeleton + data loading + Overview

Status: done

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

The tracer bullet that stands up every integration layer end-to-end. Wire a new `view`
command into the `src/cli/index.ts` dispatcher and `USAGE`. Implement shared flag parsing
(`--report <dir>` default `./crux-report`, `--from`, `--to`, `--workspace`, `--harness`,
`--no-color`, `--json`) and a `loadReport(dir)` helper that deserializes `data.json` back into
a `ParseResult` (the inverse of `serializeParseResult` in `src/cli/commands/scan.ts`),
falling back to re-parsing logs via `parseAllLogsAsyncDetailed` when `data.json` is missing.
Implement the Overview section as pure string renderers built on `render/term.ts`: a totals
line (sessions/requests/workspaces/harnesses), daily-activity sparklines (requests + LOC),
harness breakdown bars, top-workspaces bars, and an hourly-activity sparkline. Backed by
`getStats`, `getDailyActivity`, `getHarnessBreakdown`, `getWorkspaceBreakdown`,
`getHourlyDistribution`. Running `./bin/run view` (or `view overview`) prints the Overview.

#### Acceptance criteria

- [ ] `./bin/run view` and `./bin/run view overview` print the Overview from `./crux-report/data.json`
- [ ] When `data.json` is absent, the command falls back to re-parsing logs (spinner like `context-health`)
- [ ] Shared flags parse correctly: `--report`, `--from`, `--to`, `--workspace`, `--harness`, `--no-color`, `--json`
- [ ] `--json` emits the underlying Overview data; `--no-color`/`NO_COLOR`/non-TTY disable ANSI
- [ ] `view` is listed in `src/cli/index.ts` USAGE and dispatched
- [ ] Render functions are pure and unit-tested (snapshot strings, mirroring `context-health.test.ts`)
- [ ] No new dependencies added (Node built-ins + existing `render/term.ts` only)

#### User stories addressed

- As a user, after `scan` without `--open` I can view the dashboard in my terminal instantly
- As a user, I see an overview of my AI coding activity (totals, trend, harness/workspace/hourly mix)
- As a user, I can filter by date/workspace/harness, get JSON output, and disable color

---

### Task 2: `view context` section

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Route the `context` section argument to the **existing** `renderContextHealth` renderer
(`src/cli/commands/context-health.ts`), fed by `Analyzer.getContextManagement` over the
loaded report. This is the thinnest section slice and validates the section-arg routing
against a renderer that already exists.

#### Acceptance criteria

- [ ] `./bin/run view context` prints the Context Health view using the existing renderer
- [ ] Honors shared flags (`--from/--to/--workspace/--harness/--no-color/--json`)
- [ ] Reuses `renderContextHealth` without duplicating its logic
- [ ] Test covers `context` dispatch

#### User stories addressed

- As a user, I can drill into context health from the terminal dashboard

---

### Task 3: `view patterns` section

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

A terminal renderer for anti-patterns and recommendations, backed by `getAntiPatterns` and
`getRecommendations`, dispatched from the `patterns` section argument. Same table/bar/color
style as the Overview and Context Health views.

#### Acceptance criteria

- [ ] `./bin/run view patterns` prints detected anti-patterns and recommendations
- [ ] Honors shared flags including `--json`
- [ ] Pure render function with unit test

#### User stories addressed

- As a user, I can drill into anti-patterns and practice recommendations

---

### Task 4: `view flow` section

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

A terminal renderer for flow / focus state, backed by `getFlowState`, dispatched from the
`flow` section argument.

#### Acceptance criteria

- [ ] `./bin/run view flow` prints flow/focus metrics
- [ ] Honors shared flags including `--json`
- [ ] Pure render function with unit test

#### User stories addressed

- As a user, I can drill into my flow and focus state

---

### Task 5: `view credits` section

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

A terminal renderer for AI credit / token usage, backed by `getAiCredits` and
`getConsumption`, dispatched from the `credits` section argument.

#### Acceptance criteria

- [ ] `./bin/run view credits` prints credit/token usage (per-model and/or trend)
- [ ] Honors shared flags including `--json`
- [ ] Pure render function with unit test

#### User stories addressed

- As a user, I can drill into AI credit and token usage

---

### Task 6: `view production` section

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

A terminal renderer for code production, backed by `getCodeProduction`, dispatched from the
`production` section argument (AI vs user LOC, language breakdown).

#### Acceptance criteria

- [ ] `./bin/run view production` prints code production metrics
- [ ] Honors shared flags including `--json`
- [ ] Pure render function with unit test

#### User stories addressed

- As a user, I can drill into code production (AI vs me, languages)

---

### Task 7: `view all`

Status: done

- **Type**: AFK
- **Blocked by**: Task 1, Task 2, Task 3, Task 4, Task 5, Task 6

#### What to build

Compose every section renderer top-to-bottom under the `all` section argument, separated by
clear section headers, so `./bin/run view all` prints the full dashboard in one scroll.

#### Acceptance criteria

- [ ] `./bin/run view all` prints Overview + Context + Patterns + Flow + Credits + Production in order
- [ ] Reuses the per-section renderers without duplicating their logic
- [ ] Honors shared flags; `--json` emits a combined object
- [ ] Test covers the `all` composition

#### User stories addressed

- As a user, I can see everything in the dashboard at once from the terminal
