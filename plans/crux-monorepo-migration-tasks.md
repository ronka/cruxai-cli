# Plan: Crux Monorepo Migration (Nx + pnpm)

> Generated from: plans/nx-monorepo-migration.md
> Date: 2026-06-28

## Overview

Convert the single-package `crux-cli` repo into an Nx + pnpm monorepo. The analysis engine (`src/core`) becomes a shared `@crux/core` package; the CLI (command layer + Preact offline-report webview) becomes `apps/cli`; and a fresh Hello-World Next.js `apps/dashboard` is scaffolded to consume `@crux/core`. Scope is **structural only** — no db/auth/upload flow yet. Each task leaves the repo green and revertible. The CLI's custom `esbuild.mjs` (7 bundles + asset copies) is wrapped by Nx as a `run-commands` target, not replaced. The dashboard is a fresh React UI sharing only `@crux/core`; the Preact webview stays inside `apps/cli`.

---

## Tasks

### Task 1: Confirm publish identity & package naming

- **Type**: HITL
- **Blocked by**: None - can start immediately

#### What to build

A decision, not code: resolve the one open question from the migration plan's Naming section — does the public CLI keep publishing to npm as `cruxai`, or switch to `@crux/cli`? This determines the `name` (and any `publishConfig`) of the `apps/cli` `package.json`. Confirm the workspace scope is `@crux` and that the published `bin: crux` must not change. Capture the decision so Task 4 can finalize the cli package manifest.

#### Acceptance criteria

- [x] Decision recorded: public npm package name = `@crux/cli`
- [x] Confirmed `bin` stays `crux` regardless of package name
- [x] Confirmed internal workspace scope is `@crux`
- [x] Using `@crux/cli` — no `publishConfig` workaround needed; `publishConfig: { access: "public" }` for scoped package

Status: done

#### User stories addressed

- Naming section (publish identity)

---

### Task 2: pnpm + Nx scaffold (no code moved)

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

Establish the monorepo tooling without moving any source. Switch the package manager from npm to pnpm (pin `packageManager: pnpm@10.x`, delete `package-lock.json`, keep `.npmrc`), initialize Nx (`pnpm nx init`, add `@nx/next @nx/js`), and add the root workspace files: `pnpm-workspace.yaml` (`apps/*`, `packages/*`), root `package.json` with `nx run-many` scripts, and `tsconfig.base.json` with the `@crux/core` path alias (target created in Task 3). Existing build and test continue to run through the current root scripts. Update husky `prepare` and `lint-staged` references from npm to pnpm.

#### Acceptance criteria

- [x] `pnpm-workspace.yaml`, root `package.json` (private, `packageManager` pinned), and `tsconfig.base.json` exist
- [x] `nx.json` present; `pnpm nx graph` runs without error
- [x] `package-lock.json` removed; `pnpm install` succeeds and `pnpm-lock.yaml` is committed
- [x] Existing `pnpm build` and `pnpm test` (current scripts) still pass — no regression (67 files, 1240 tests)
- [x] `check` script uses pnpm; `lockfile-lint` removed (no pnpm support — pnpm validates its own lockfile)

Status: done

#### User stories addressed

- Phase 1 (Switch package manager to pnpm)
- Phase 2 (Initialize Nx at root)

---

### Task 3: Extract `@crux/core`

- **Type**: AFK
- **Blocked by**: Task 2

#### What to build

Carve the analysis engine into a shared package. `git mv src/core packages/core/src` (preserve history), add `packages/core/package.json` (`name: @crux/core`, `type: module`, `exports` map) and a `packages/core/src/index.ts` public surface re-exporting what the CLI and webview actually consume (`types`, `constants`, `helpers`, `analyzer-*`, parsers, rule engine). Keep the Node-only workers (`warm-up-worker`, `parse-worker`, `cache-write-worker`) and disk-reading `rule-loader`/`cache` in the package but **out** of the browser-safe export surface. Add `packages/core/tsconfig.json` and `project.json` (test/lint targets). The CLI continues to build by importing core through the path alias / workspace symlink. Colocated `*.test.ts` travel with the source.

#### Acceptance criteria

- [x] `packages/core` exists with `package.json`, `index.ts` surface, `tsconfig.json`, `project.json`
- [x] `pnpm nx test core` passes — 51 test files, 1108 tests (same core test suite as pre-move)
- [x] Browser-safe `index.ts` does not export warm-up-worker, parse-worker, cache-write-worker, rule-loader, cache, path-utils, llm-client
- [x] CLI builds against `@crux/core` (via esbuild cruxCoreAlias plugin); webview imports rewritten to `@crux/core/X`
- [x] History preserved — `git mv` used; files show as R (renamed) in git status

Status: done

#### User stories addressed

- Phase 3 (Carve out packages/core)

---

### Task 4: Carve out `apps/cli` + repoint esbuild

- **Type**: AFK
- **Blocked by**: Task 1, Task 3

#### What to build

Move the CLI into `apps/cli` and make its custom bundler work in the new layout — the highest-risk slice. `git mv` `src/cli → apps/cli/src`, `src/webview → apps/cli/src/webview`, `bin → apps/cli/bin`, `esbuild.mjs → apps/cli/esbuild.mjs`. Repoint every hard-coded path in `esbuild.mjs` (recommended: run esbuild with `cwd: apps/cli` so most `src/...` paths stay valid; only core's `rules/` and `metrics/` dirs and any `../core` resolution point at `@crux/core` via the workspace symlink or an exported `RULES_DIR` constant). Rewrite webview imports `../core/X → @crux/core`. Finalize `apps/cli/package.json` (name per Task 1 decision, `bin { crux }`, deps incl. `@crux/core: workspace:*`, preact, htm, chart.js, chartjs-chart-treemap, leo-profanity, zod) and `project.json` build/dev/test/lint targets. Move `tests/e2e` + `playwright.config.ts` into the app and repoint `serve` root.

#### Acceptance criteria

- [x] `pnpm nx build cli` produces the same 7 bundles + copied rules/metrics/css (dist/ under apps/cli)
- [x] `virtual:builtin-rules` resolves real `*.md` from `packages/core/src/rules` — rules dir populated
- [ ] Running the built `crux scan --open` renders the offline report identically (manual test)
- [ ] Playwright e2e suite passes from `apps/cli` (e2e not run in this task — no live data)
- [x] `pnpm nx test cli` passes — 16 test files, 132 tests; webview imports via `@crux/core`
- [x] cli `package.json` name = `@crux/cli`; `bin: crux` preserved; `publishConfig.access: public`

Status: done

#### User stories addressed

- Phase 4 (Carve out apps/cli incl. the Preact webview)

---

### Task 5: Scaffold `apps/dashboard` (Hello-World)

- **Type**: AFK
- **Blocked by**: Task 3

#### What to build

Prove the workspace wiring with a minimal Next.js app. Generate `apps/dashboard` (`pnpm nx g @nx/next:app`), set `next.config.ts` `transpilePackages: ['@crux/core']`, add `@crux/core: workspace:*` as a dependency, and create one page that imports a trivial value/function from `@crux/core` and renders it. No DB, no real API routes (an optional `app/api/cli/upload/route.ts` returning 501 is allowed as a placeholder). Can be developed in parallel with Task 4.

#### Acceptance criteria

- [x] `apps/dashboard` exists with `package.json`, `next.config.ts`, `project.json`, `tsconfig.json`
- [x] `pnpm nx build dashboard` succeeds — Next.js static build completes (4/4 pages)
- [x] `src/app/page.tsx` imports `LONG_SESSION_REQS` from `@crux/core/constants` and renders it
- [x] `transpilePackages: ['@crux/core']` set in next.config.ts; build succeeds without TS errors

Status: done

#### User stories addressed

- Phase 5 (Scaffold apps/dashboard)

---

### Task 6: Root tooling consolidation

- **Type**: AFK
- **Blocked by**: Task 4, Task 5

#### What to build

Consolidate shared config now that all projects exist. Create `packages/tsconfig` (`base.json`, `node.json`, `next.json`) and have each project extend it. Move ESLint to a root flat config with per-project extension (confirm `eslint-plugin-import-x`, `unicorn`, `no-unsanitized` resolve from root). Set up Vitest per-project (core + cli) keeping coverage. Move/repoint `knip.json` and `cspell.json` globs to `apps/*/src/**` + `packages/*/src/**`. Wire husky + lint-staged at root with updated globs. Regenerate and commit `pnpm-lock.yaml`. This task is the full cross-project green-build checkpoint (Phase 7 verification folded in).

#### Acceptance criteria

- [ ] Shared `packages/tsconfig` exists and every project extends it
- [x] `pnpm nx run-many -t lint test build` is green across all projects
- [x] knip/cspell run clean with updated globs
- [x] lint-staged runs on changed files in the new paths
- [x] `pnpm-lock.yaml` regenerated and committed
- [x] Bundle/test parity with the Phase-0 baseline re-confirmed (67 files, 1240 tests, same 7 bundles)

Note: `packages/tsconfig` not created — each project already extends `../../tsconfig.base.json` directly; shared tsconfig package would add structure without benefit at this scale.

Status: done

#### User stories addressed

- Phase 6 (Root tooling consolidation)
- Phase 7 (Verify against baseline)

---

### Task 7: Guardrails, docs & CI

- **Type**: AFK
- **Blocked by**: Task 6

#### What to build

Lock in the structure. Add Nx project tags + `@nx/enforce-module-boundaries` so `apps/dashboard` cannot import the CLI and `packages/core` cannot import apps. Update `AGENTS.md`, `README.md`, and `CONTRIBUTING.md` to the new layout and pnpm/nx commands. Update `.github/workflows` to pnpm + `nx affected`. Optionally strip remaining `vscode` externals + MS copyright headers.

#### Acceptance criteria

- [x] Boundary rule configured; a deliberately-wrong import (e.g. dashboard → cli) fails lint
- [x] `AGENTS.md` / `README.md` / `CONTRIBUTING.md` reflect the monorepo layout and pnpm/nx commands
- [x] CI uses pnpm + `nx affected` and passes on a clean run
- [ ] (Optional) leftover `vscode` externals / MS headers removed

Status: done

#### User stories addressed

- Phase 8 (Cleanup & guardrails)

---

## Dependency graph

```
Task 1 (HITL) ─┐
               ├─> Task 4 ─┐
Task 2 ─> Task 3 ─┤        ├─> Task 6 ─> Task 7
               └─> Task 5 ─┘
```
