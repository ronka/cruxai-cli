# Plan: crux CLI — `scan` migration

> Generated from: conversation (grill-me session, 2026-06-25)
> Date: 2026-06-25

## Overview

Turn the **AI Engineer Coach** VS Code extension into a CLI named **crux**. The first
command, `crux scan`, parses the user's local AI session logs in-process and writes a
**self-contained, fully interactive** offline dashboard to a folder. The output reuses the
existing Preact webview bundle unchanged; the key move is running the `Analyzer` **in the
browser** against a baked `data.json` snapshot, with the webview's `rpc()` shimmed to dispatch
locally instead of over postMessage/HTTP. This keeps date/workspace/harness filters and
drill-downs working offline. v1 ships five analytic pages (Dashboard, Timeline, Output,
Patterns, Anti-Patterns practice-score cards). The repo hard-forks to CLI-only, but additively:
PR1 (Tasks 1–6) lands the CLI while the extension still builds; PR2 (Task 7) strips the VS Code
surface.

### Locked decisions (from the grill)

| # | Decision | Choice |
|---|---|---|
| 1 | Output | Self-contained interactive HTML bundle |
| 2 | Snapshot | Fat: bake `Session[]`, run `Analyzer` in-browser |
| 3 | v1 pages | Dashboard, Timeline, Output, Patterns, Anti-Patterns (practice-score cards only) |
| 4 | scan mode | Static files only; `--open` opens browser; `serve` deferred |
| 5 | End state | Hard fork to CLI-only ("crux"), VS Code extension removed |
| 6 | Sequencing | PR1 additive (extension stays green) → PR2 deletes extension/chat/mcp/contributes |
| 7 | Privacy | Verbatim local mirror + `[warn]` notice; no redaction |
| 8 | Packaging | Local bin (`npm link` / `node ./bin/run`), oclif multi-command, no npm publish yet |

### Target output

```
report/
  index.html     <- dashboard-shell.ts, trimmed to 5 nav items
  app.js         <- existing webview bundle, UNCHANGED
  analyzer.js    <- NEW browser bundle: Analyzer + lean local RPC dispatch
  styles.css     <- existing, UNCHANGED
  data.json      <- verbatim Session[] (+ editLocIndex, workspaces)
```

### Reuse vs. new

- **Reused untouched:** `src/core/` (parsers + analyzers), webview `app.js` bundle, `styles.css`,
  `dashboard-shell.ts` (already has `includeSkillFinder`/`includeLevelUp` toggles).
- **New:** `src/cli/` (oclif `scan` command), an esbuild **browser** bundle pairing `Analyzer`
  with a lean local RPC dispatcher, and a build-time swap of `shared.rpc` from postMessage →
  local dispatch.

---

## Tasks

### Task 1: Spike — browser-bundle the Analyzer

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

A throwaway proof that the `Analyzer` can run in a browser bundle. Point esbuild
`platform: browser` at a tiny entry that does `new Analyzer(sessions).getStats()` (and the other
in-scope methods) against a small fixture, and record what fails to resolve. The five in-scope
pages reach `analyzer.ts`, `analyzer-dashboard`, `analyzer-production`, `analyzer-timeline`,
`analyzer-patterns`, plus `detectors`, `helpers`, `session-totals`, `metric-engine` for
`getAntiPatterns`. `analyzer.ts` imports `path` (string ops, expected/shimmable); `analyzer-config.ts`
imports `fs` but Context Health is out of scope and must be excluded. Output is a short findings
note plus the chosen shim/refactor approach (e.g. `path` polyfill vs. inline string ops). This
retires the single biggest architectural risk before any product code is written.

#### Acceptance criteria

- [x] esbuild `platform: browser` build attempted on `new Analyzer(sessions).getStats()` plus the other in-scope methods (`getCodeProduction`, `getTimeline`, `getPatterns`, `getAntiPatterns`)
- [x] Every unresolved node built-in on the in-scope path is documented with a fix (shim, refactor, or exclude)
- [x] `analyzer-config.ts` / Context Health confirmed excludable from the in-scope bundle
- [x] Findings note committed (or captured in the PR description) with the shim/refactor decision
- [x] Spike code is clearly throwaway (not wired into the build)

Status: done

#### User stories addressed

- De-risks US2, US3

---

### Task 2: Tracer bullet — `crux scan` renders the Dashboard offline

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

The thinnest end-to-end path through every layer. A minimal oclif `scan` command that reuses
`findLogsDirs()` + `parseAllLogsAsyncDetailed()` (as `canvas/host.ts` does) to parse logs
in-process, serializes the `ParseResult` to `data.json` (handling the `Map` fields —
`editLocIndex`, `workspaces` — on the way out and rehydrating in the browser), and writes
`index.html` from `getDashboardShellHtml()` plus the **existing** `app.js` and `styles.css`. A
new esbuild **browser** bundle (`analyzer.js`) constructs `new Analyzer(sessions, …)` from
`data.json` and exposes a lean local `rpc` dispatcher wired for `getStats`, `getWorkspaces`, and
`getHarnesses`. The webview's `rpc` import (`src/webview/shared`) is swapped at build time so
`app.js` dispatches locally instead of over postMessage/HTTP. `--open` opens `index.html`.
Demoable: run `crux scan --open`, see the real Dashboard populated with your data, no server
running. This establishes the rpc-shim swap, the `data.json` (de)serialization, and the build
mechanism that Tasks 3–5 reuse.

#### Acceptance criteria

- [x] `crux scan` runs as an oclif command via `node ./bin/run scan` (or `npm link` + `crux scan`)
- [x] Logs parsed in-process by reusing `findLogsDirs()` + `parseAllLogsAsyncDetailed()`
- [x] `ParseResult` serialized to `data.json` and faithfully rehydrated in the browser (Maps restored)
- [x] New `analyzer.js` browser bundle constructs `Analyzer` from `data.json` and serves `getStats`/`getWorkspaces`/`getHarnesses` via a local rpc dispatcher
- [x] `app.js`'s `rpc` is swapped to local dispatch at build time (no postMessage/HTTP)
- [x] `crux scan --out ./report --open` writes the folder and opens the Dashboard in the browser
- [x] Dashboard renders real metrics offline (no running server)

Status: done

#### User stories addressed

- US1, US2

---

### Task 3: Output, Timeline, and Patterns pages

- **Type**: AFK
- **Blocked by**: Task 2

#### What to build

Register `getCodeProduction` (Output), `getTimeline` (Timeline), and `getPatterns` (Patterns)
in the local rpc dispatcher from Task 2. Verify each page renders from the baked `data.json` and
that changing the date range, workspace, or harness filter re-runs the `Analyzer` client-side and
updates the page. No new parsing or build mechanism — this is registering three more analytic
methods on the existing dispatcher.

#### Acceptance criteria

- [x] Output page renders from `data.json` and responds to filters
- [x] Timeline page renders (including per-day drill-down) and responds to filters
- [x] Patterns page (heatmap) renders and responds to filters
- [x] All three work with no server running

Status: done

#### User stories addressed

- US3

---

### Task 4: Anti-Patterns page (practice-score cards)

- **Type**: AFK
- **Blocked by**: Task 2

#### What to build

Register `getAntiPatterns` in the local rpc dispatcher. This serves the practice-score cards,
which come from `Analyzer.getAntiPatterns(filter)` — built-in **code** detectors, pure and
filter-responsive. Explicitly **defer** the 45-markdown-rule coverage heatmap and the Rule Editor:
those run through the rule engine, which `fs.readdirSync`s rule `.md` files at runtime and would
need the rule markdown + engine embedded into the browser bundle. Hide that half of the page in
the scan bundle.

#### Acceptance criteria

- [x] Anti-Patterns practice-score cards render from `data.json` and respond to filters
- [x] The 45-rule coverage heatmap and Rule Editor are hidden / not present in the scan bundle
- [x] No `fs`/rule-loader code reaches the browser bundle
- [x] Works with no server running

Status: done

#### User stories addressed

- US3

---

### Task 5: Filter flags, nav trim, and privacy notice

- **Type**: AFK
- **Blocked by**: Task 2

#### What to build

Make `scan` shippable. Add `--from` / `--to` / `--workspace` / `--harness` flags mapped to the
initial `DateFilter` the bundle boots with, plus `--out` (default `./crux-report`) and `--open`.
Extend `getDashboardShellHtml()` options to gate the nav down to the five shipping items (hide
Coding Moments, Burndown, Context Health, Skill Finder, Level Up). Print the `[warn]` notice that
the output folder contains raw session data, including any secrets present in the logs. Default
the workspace filter to **All** (a CLI has no repo context, unlike the extension's "Current").

#### Acceptance criteria

- [x] `--from`, `--to`, `--workspace`, `--harness` flags map to the bundle's initial `DateFilter`
- [x] `--out` defaults to `./crux-report`; `--open` opens the result
- [x] Nav shows only the five shipping pages (Dashboard, Timeline, Output, Patterns, Anti-Patterns)
- [x] `[warn]` notice about raw session data is printed on every scan
- [x] Default workspace filter is All

Status: done

#### User stories addressed

- US3, US4

---

### Task 6: CLI build, check-gate, and tests (CI stays green)

- **Type**: AFK
- **Blocked by**: Task 2

#### What to build

Promote the build changes from a tracer hack to first-class and keep CI green — closing PR1. Wire
the esbuild CLI node bundle and the `analyzer.js` browser bundle into `esbuild.mjs`; update
`knip.json`, eslint, `tsc --noEmit`, and the test config so `src/cli` is covered and nothing in
the still-present extension breaks. Add a `scan` smoke test (parses a fixture, asserts the output
folder shape) and a serialization round-trip test for `data.json`. The extension must still build
and `npm run check` must pass at the end of this task.

#### Acceptance criteria

- [x] `esbuild.mjs` builds the CLI bundle and the `analyzer.js` browser bundle
- [x] `npm run check` (typecheck + lint + spellcheck + knip + test) passes with `src/cli` present
- [x] The VS Code extension still builds (PR1 is additive)
- [x] `scan` smoke test asserts the output folder shape (`index.html`, `app.js`, `analyzer.js`, `styles.css`, `data.json`)
- [x] `data.json` serialize → rehydrate round-trip test (Maps preserved)

Status: done

#### User stories addressed

- US6

---

### Task 7: Strip the VS Code extension, finalize the hard fork

- **Type**: HITL
- **Blocked by**: Tasks 2, 3, 4, 5, 6

#### What to build

Complete the hard fork to CLI-only — PR2. Delete `src/extension.ts`, the `contributes` /
`activationEvents` / `engines.vscode` blocks from `package.json`, `src/chat`, and `src/mcp`.
Re-point `esbuild.mjs` and the `npm run check` gate to the CLI-only surface. Rename the product
from "AI Engineer Coach" to "crux" across `package.json`, README, and `AGENTS.md`. **Keep**
`src/canvas/host.ts` — it is the headless server the deferred `serve` command will reuse. HITL
for the branding/rename and the larger deletion diff: a human reviews the new product identity and
confirms nothing still-needed is removed.

#### Acceptance criteria

- [x] `src/extension.ts`, `src/chat`, `src/mcp` removed
- [x] `package.json` `contributes` / `activationEvents` / `engines.vscode` removed; package renamed to crux
- [x] `esbuild.mjs` and `npm run check` re-pointed to CLI-only; `npm run check` passes
- [~] `src/canvas/host.ts` retained for the future `serve` command — **deviation:** removed at the user's explicit request for a leaner CLI-only fork; `serve` would be rebuilt later
- [x] README and `AGENTS.md` updated to describe the crux CLI (product renamed)
- [ ] Human review sign-off on branding/rename and the deletion scope

Status: done (pending human sign-off)

#### Notes / deviations from plan

- **Canvas + workers strip.** Per the user's decision, `src/canvas/host.ts` and the canvas RPC
  surface (`panel-rpc`, `panel-shared`, `panel-llm`) were deleted alongside the extension. The
  three worker bundles (`parse-worker`, `warm-up-worker`, `cache-write-worker`) were **kept** —
  they are still live in the CLI runtime via `Analyzer.warmUp()` with a synchronous fallback, and
  removing them would be a refactor of the core parse/analysis path rather than a deletion.
- **Extra dead-code removed for the gate:** `summary-export-vscode.ts`, the VS Code panel host
  (`panel.ts`, `panel-sidebar.ts`, `panel-html.ts`, `panel-request-service.ts`, `panel-cache.ts`),
  the natural-language `rule-compiler.ts` (VS Code LM API), the `package-extension` skill, and the
  VSIX packaging scripts (`package-readme-swap.mjs`, `smoke-test.mjs`, `dev-install.sh`,
  `.vscodeignore`, `README.extension.md`). `@types/vscode` dropped; `Thenable` → `PromiseLike`.
- **Pre-existing gate failures fixed:** `main` was already red (untyped `new Array()` in
  `view.test.ts`; missing cspell words). Fixed to land a green `npm run check`.
- **Attribution:** Microsoft MIT `LICENSE`/`NOTICE` retained verbatim, own copyright + fork
  provenance note added (LICENSE, NOTICE, README "Provenance", AGENTS.md).
- CI re-pointed: `ci.yml`/`release.yml` no longer package a VSIX; `check-size` targets `dist/cli.cjs`.

#### User stories addressed

- US5

---

## Sequencing notes

- **PR1** = Tasks 1–6 (additive; extension still builds, CI green throughout).
- **PR2** = Task 7 (deletes the VS Code surface; HITL review).
- Tasks 3, 4, 5, and 6 all hang off Task 2 and can proceed in parallel once the tracer lands.
- Deferred beyond v1: `serve` (live dashboard via `src/canvas/host.ts`), Coding Moments
  (needs image-file baking), the 45-rule coverage heatmap + Rule Editor, all LLM/agent pages,
  and npm publishing.
