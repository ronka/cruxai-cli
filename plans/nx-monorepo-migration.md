# Crux Monorepo Migration Plan (Nx + pnpm)

> Tailored to the **actual** repo, not the generic oclif sketch in `nx-monorepo.md`.
> This CLI is bundled by a hand-rolled `esbuild.mjs` (7 bundles + asset copies), and its
> dashboard UI is **Preact + htm**, not oclif/React. The plan below accounts for that.

## Decisions (locked)

| Question | Choice |
|---|---|
| Tooling | **pnpm + Nx** — Nx wraps the existing `esbuild.mjs` as a `run-commands` target; it does **not** replace it. |
| Dashboard UI | **Share `packages/core` only.** Next.js dashboard is a **fresh React UI**. The offline scan report keeps the Preact webview, which stays inside `apps/cli`. |
| Scope of this migration | **Structural only.** `apps/cli` + `packages/core` (+ shared tsconfig) building exactly as today, plus an empty Hello-World `apps/dashboard`. No db / upload / auth yet. Goal: **green builds & tests** in the new layout. |

Deferred to later PRs: `packages/db`, `packages/api-client`, `packages/auth`, `apps/worker`, the `login`/`upload` flow, and any UI sharing between webview and dashboard.

---

## Current state (what we're moving)

```
crux-cli/
  src/
    core/      # analysis engine: parsers, analyzers, metrics, rules DSL, detectors, schemas (~bulk of 57k LOC)
               #   - mostly pure, BUT some Node-only: warm-up-worker, parse-worker, cache-write-worker,
               #     cache.ts, rule-loader.ts (reads rules from disk)
               #   - leftover `external: ['vscode']` + MS copyright headers (VS Code fork residue)
    webview/   # Preact + htm dashboard: 40+ page-*.ts, charts, 4 CSS files. Imports ../core (types, constants, helpers, analyzer-images)
    cli/       # command layer: index.ts dispatcher + commands/{scan,context-health,skills,view}.ts
               #   render/term.ts (terminal output), browser/{analyzer-entry,shared-browser,stubs}
  bin/run.js   # require('../dist/cli.cjs')
  esbuild.mjs  # orchestrates: cli.cjs, webview/app.js, scan/app.js, scan/analyzer.js, 3 node workers + copies rules/metrics/css
  scripts/     # tsx/mjs analysis & bench scripts
  tests/e2e/   # Playwright specs (serve . + harness.html)
  *.config     # tsconfig.json, eslint.config.mjs, vitest.config.mts, knip.json, cspell.json, playwright.config.ts
  package.json # npm (package-lock.json), preact/chart.js/zod deps
```

Cross-package coupling that matters:
- `src/webview/*` imports `../core/{types,constants,helpers,analyzer-images,types/rule-types}` → becomes `@crux/core` imports.
- `esbuild.mjs` hard-codes paths like `src/core/rules`, `src/webview/styles.css`, `src/cli/browser/*`. Every one of these must be re-pointed when files move.
- Vitest test files (`*.test.ts`) live **next to source** in `src/core` and `src/webview` → they travel with the code into each package.

---

## Target structure

```
crux/
  apps/
    cli/
      bin/run.js
      src/                # ← was src/cli + src/webview (webview stays with the offline report)
        index.ts
        commands/
        render/
        browser/
        webview/          # Preact offline-report UI (moved here, imports @crux/core)
      esbuild.mjs         # repointed paths; resolves @crux/core
      project.json        # Nx: build/dev/test/lint -> run-commands wrapping pnpm scripts
      package.json        # name @crux/cli, bin { crux }, deps: @crux/core (workspace:*)
      tsconfig.json
    dashboard/
      app/                # Next.js App Router, Hello-World
      next.config.ts      # transpilePackages: ['@crux/core']
      project.json
      package.json        # name @crux/dashboard, deps: @crux/core (workspace:*)
      tsconfig.json
  packages/
    core/
      src/                # ← was src/core (parsers, analyzers, metrics, rules, dsl, detectors, schemas)
      package.json        # name @crux/core, exports map, "type": "module"
      project.json        # test/lint targets
      tsconfig.json
    tsconfig/
      base.json
      node.json
      next.json
  nx.json
  pnpm-workspace.yaml
  package.json            # root: private, packageManager pnpm, nx scripts
  tsconfig.base.json      # path aliases: @crux/core -> packages/core/src
  eslint.config.mjs       # root flat config, projects extend
  pnpm-lock.yaml          # replaces package-lock.json
```

Dependency direction (enforced later via Nx tags):
```
apps/cli ───────┐
                ├──> packages/core
apps/dashboard ─┘
```
`packages/core` depends on nothing internal. The webview lives in `apps/cli` and may import `@crux/core`.

---

## Naming

- Scope: **`@crux`** (matches product). CLI bin stays **`crux`**.
- Published npm package: the public CLI keeps publishing as `cruxai` from `apps/cli` (its `package.json` `name` can stay `cruxai` for the registry while internal name is `@crux/cli` — or keep `@crux/cli` and set `publishConfig`). **Confirm before first publish from the new layout.**

---

## Phased execution

### Phase 0 — Prep (no moves yet)
1. Branch: `git checkout -b chore/monorepo-nx`.
2. Confirm clean working tree; commit the stray `plans/` files first.
3. Snapshot current outputs to compare against later: `npm run build` then record `dist/` tree + `npm test` pass count. This is the regression baseline.
4. Decide pnpm version, pin in root `packageManager` (e.g. `pnpm@10.x`).

### Phase 1 — Switch package manager to pnpm
1. `corepack enable && corepack prepare pnpm@10.x --activate`.
2. Delete `package-lock.json`; keep `.npmrc` (`save-exact=true` is still honored by pnpm).
3. Add root `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
4. Don't install yet — install after the workspace packages exist (Phase 3).
5. Update husky `prepare`, `lint-staged`, and any `npm run` references in scripts/docs to pnpm.

### Phase 2 — Initialize Nx at root
1. `pnpm add -D nx` then `pnpm nx init` (choose "integrated", skip remote caching for now).
2. Add `@nx/next @nx/js` dev deps.
3. Root `package.json` scripts (from the doc, scoped to `@crux`):
   - `dev`, `build`, `lint`, `test` → `nx run-many -t <target>`
   - `build:cli`, `build:dashboard`, `dev:dashboard`, etc.
4. Create `tsconfig.base.json` with path alias `@crux/core` → `packages/core/src/index.ts`.

### Phase 3 — Carve out `packages/core`
This is the highest-risk move (it's most of the code + all the worker/disk paths).
1. `git mv src/core packages/core/src` (preserve history).
2. Add `packages/core/package.json`:
   - `name: @crux/core`, `type: module`, `exports` map. Decide the **public surface** — create `packages/core/src/index.ts` re-exporting what `cli` and `webview` actually consume (`types`, `constants`, `helpers`, `analyzer-*`, parsers, rule engine, etc.). Deep imports stay possible during migration but tighten later.
3. `packages/core/tsconfig.json` extends `../tsconfig/node.json`.
4. Decide what to do with the **Node-only workers** (`warm-up-worker`, `parse-worker`, `cache-write-worker`) and disk-reading `rule-loader`/`cache`:
   - They stay in `@crux/core` but are **not** part of the browser-safe export surface. The dashboard (server-side) can use them; the offline browser bundle already stubs them via esbuild plugins (`stub-rule-loader`, `stub-analyzer-config`) — those stubs move with the CLI and must re-resolve to `@crux/core/...`.
5. Remove `external: ['vscode']` / MS headers opportunistically (optional; not required for green build).
6. Move the colocated `src/core/*.test.ts` with the source (they already travel via `git mv`). Vitest config moves/extends per-package.

### Phase 4 — Carve out `apps/cli` (incl. the Preact webview)
1. `git mv src/cli apps/cli/src` and `git mv src/webview apps/cli/src/webview`.
2. `git mv bin apps/cli/bin`; `git mv esbuild.mjs apps/cli/esbuild.mjs`.
3. **Repoint every path in `esbuild.mjs`** — it currently assumes repo-root-relative `src/...` and `dist/...`:
   - entry points: `src/cli/index.ts` → `apps/cli/src/index.ts` (or run esbuild with cwd=`apps/cli` and keep relative paths — preferred, fewer edits).
   - `sharedBrowserSwap` resolves `./src/cli/browser/shared-browser.ts`, `analyzerBrowserStubs` resolve `stub-*`, `builtinRulesVirtualModule` reads `src/core/rules` → now `@crux/core` rules dir (resolve via `require.resolve`/import.meta or a path exported from core).
   - asset copies: `src/core/rules` → core package's rules dir; `src/core/metrics` → core's metrics; `src/webview/styles*.css` → `apps/cli/src/webview/...`.
   - **Recommendation:** run esbuild with `cwd: apps/cli` so most `src/...` paths stay valid; only the two that reach into core (rules dir + metrics dir + any `../core` resolution) need to point at `@crux/core`. Resolve those via the workspace symlink (`node_modules/@crux/core/...`) or a small exported constant from core like `export const RULES_DIR = ...`.
4. Update `src/webview/*` imports `../core/X` → `@crux/core` (or `@crux/core/X` for deep paths kept during transition).
5. `apps/cli/package.json`: `name @crux/cli` (or keep `cruxai` for publish), `bin { crux: ./bin/run.js }`, `dependencies: { @crux/core: "workspace:*", preact, htm, chart.js, chartjs-chart-treemap, leo-profanity, zod }`. `bin/run.js` now requires `./dist/cli.cjs` relative to the app.
6. `project.json` targets: `build` → `node esbuild.mjs` (run-commands, cwd app), `dev` → `--watch`, `test` → `vitest run`, `lint` → `eslint src/`.
7. Move `tests/e2e` + `playwright.config.ts` into `apps/cli` (the offline report is what they exercise). Repoint `serve .` to the app dir / built `dist`.
8. Move `scripts/` that target the CLI/core into `apps/cli/scripts` (or keep at root if cross-cutting). Update their relative imports.

### Phase 5 — Scaffold `apps/dashboard` (Hello-World)
1. `pnpm nx g @nx/next:app dashboard --directory=apps/dashboard --style=css --appDir=true`.
2. `next.config.ts`: `transpilePackages: ['@crux/core']`.
3. `package.json` deps: `@crux/core: workspace:*`.
4. One page that imports a trivial value from `@crux/core` (e.g. a constant or `analyzeSessions`-style export) to **prove the workspace wiring end-to-end**. No DB, no API routes yet (a stubbed `app/api/cli/upload/route.ts` returning 501 is optional).

### Phase 6 — Root tooling consolidation
1. **Shared tsconfig** in `packages/tsconfig` (`base.json`, `node.json`, `next.json`); each project extends.
2. **ESLint** flat config at root; per-project configs extend. Confirm `eslint-plugin-import-x`, `unicorn`, `no-unsanitized` still resolve from root.
3. **Vitest**: per-project `vitest.config.mts` (core + cli) or a root workspace config. Keep coverage working.
4. Move `knip.json`, `cspell.json` to root or per-package; update globs (`src/**` → `apps/*/src/**`, `packages/*/src/**`).
5. `husky` + `lint-staged` at root; globs updated to new paths.
6. `pnpm install` → generates `pnpm-lock.yaml`. Commit it.

### Phase 7 — Verify against baseline
1. `pnpm nx build cli` → diff `apps/cli/dist` against Phase-0 snapshot (same bundles: `cli.cjs`, `webview/app.js`, `scan/app.js`, `scan/analyzer.js`, 3 workers, copied rules/metrics/css).
2. `pnpm nx test core` and `pnpm nx test cli` → same pass count as baseline.
3. `crux scan --open` (run the built bin) → offline report renders identically.
4. `pnpm nx build dashboard` → Next build succeeds, page reads from `@crux/core`.
5. `pnpm nx run-many -t lint test build` all green.
6. Playwright e2e green.

### Phase 8 — Cleanup & guardrails
1. Add Nx project tags + `@nx/enforce-module-boundaries` so dashboard can't import the CLI, and core can't import apps.
2. Update `AGENTS.md` / `README.md` / `CONTRIBUTING.md` to the new layout and pnpm/nx commands.
3. Update `.github/workflows` to pnpm + `nx affected`.
4. Optional: strip remaining `vscode` externals + MS headers.

---

## Repo-specific risks & gotchas

1. **`esbuild.mjs` path coupling is the main hazard.** Seven bundles + virtual-module rule loader + four asset-copy blocks all use repo-root-relative paths. Running esbuild with `cwd: apps/cli` minimizes edits; only core's `rules/` and `metrics/` dirs must resolve through the workspace symlink. Verify the `virtual:builtin-rules` module still finds `*.md` after the move — a silent empty list means Anti-Patterns detects nothing.
2. **Preact in `apps/cli`, not shared.** Per the decision, the webview is NOT extracted. This avoids the fragile Preact-in-Next path. The dashboard re-implements UI in React and shares only `@crux/core`.
3. **`@crux/core` has a dual nature** (pure analysis vs Node workers/disk IO). Keep the browser-safe surface in `index.ts`; never let the offline browser bundle pull in `parse-worker`/`rule-loader` except through the existing esbuild stubs (which move into `apps/cli` and must re-resolve).
4. **Colocated tests** travel with source automatically via `git mv`. Ensure each package's vitest picks up its own `*.test.ts` and that cross-package test imports become `@crux/core`.
5. **npm → pnpm**: `save-exact` preserved; watch for any dependency relying on hoisting (pnpm's strict node_modules can surface missing peer deps — `chart.js`/`chartjs-chart-treemap`, `preact`/`htm`). May need `.npmrc` `public-hoist-pattern` or `shamefully-hoist` as a last resort.
6. **Publish identity**: the public package is `cruxai`. Decide whether `apps/cli` publishes as `cruxai` (keep `name: cruxai`) or `@crux/cli`. Don't break the published `bin: crux`.
7. **Playwright** serves the offline report statically; repoint its `serve` root to `apps/cli/dist/scan` (or wherever the report lands) and confirm `harness.html` path.
8. **Use `git mv`** for every move to preserve blame/history across this large reorg.

---

## Suggested PR sequence

1. **PR 1 — pnpm + Nx scaffold** (Phases 1–2): workspace files, Nx init, no code moved yet. Builds still run via existing scripts.
2. **PR 2 — extract `@crux/core`** (Phase 3): the big `git mv`, `index.ts` surface, core builds+tests green; CLI temporarily imports core via path alias.
3. **PR 3 — `apps/cli`** (Phase 4): move CLI + webview, repoint esbuild, e2e green. Regression-diff dist against baseline.
4. **PR 4 — `apps/dashboard` Hello-World** (Phase 5) + root tooling consolidation (Phase 6) + guardrails (Phase 8).

Each PR ends green and independently revertible. Defer db/api-client/auth/upload to a later milestone once the structure is proven.
```
