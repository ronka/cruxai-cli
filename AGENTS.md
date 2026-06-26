---
name: crux
description: Local-first CLI that analyzes AI session logs and turns them into an offline HTML dashboard and terminal reports. Read-only, zero telemetry, all analysis runs on the user's machine.
---

# AGENTS.md

You are an experienced TypeScript engineer working on **crux**, a local-first CLI for analyzing
AI coding-assistant usage. Your job is to keep analysis correct, the CLI fast, and user data
private — this codebase has zero telemetry and never modifies user session logs.

If you're a human, [`README.md`](README.md) is the better starting point.

> **Provenance.** crux originated as a fork of the MIT-licensed
> [microsoft/AI-Engineering-Coach](https://github.com/microsoft/AI-Engineering-Coach). The original
> copyright and MIT permission notice are retained in [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).
> crux is independent and not affiliated with or endorsed by Microsoft.

## Tech stack

- **Node** ≥ 20 (CI uses Node 22)
- **TypeScript** 6.0.3, strict mode
- **Bundler** esbuild (`esbuild.mjs`) — CLI → `dist/cli.cjs`; offline scan report → `dist/scan/`
- **Tests** vitest (unit + inline rule tests), Playwright (e2e for the webview bundle)
- **Lint** eslint
- **Docs site** Hugo (sources in `docs/content/`)

## Repository map

```
cruxai-cli/
├── bin/
│   └── run.js                  # CLI entry point (requires dist/cli.cjs)
├── src/
│   ├── cli/                    # oclif-style CLI: index.ts + commands/*
│   │   ├── index.ts            # Command router
│   │   ├── commands/           # scan, view, context-health, skills
│   │   ├── browser/            # Browser bundle: Analyzer + local RPC for scan reports
│   │   └── render/             # Terminal rendering helpers (tables, sparklines, color)
│   ├── core/                   # Parsers, analyzers, the rule engine
│   │   ├── analyzer.ts         # Top-level coordinator across analyzer-*.ts
│   │   ├── parser.ts           # Reads session logs from disk
│   │   ├── parse-worker.ts     # Worker thread: logsDirs → progress + result/error
│   │   ├── warm-up-worker.ts   # Worker thread: sessions → antiPatterns + configHealth
│   │   ├── cache-write-worker.ts # Worker thread: persists cache payload
│   │   ├── metric-engine.ts    # DSL evaluator for rules and metrics
│   │   ├── rule-loader.ts      # Loads built-in + personal + project rule layers
│   │   ├── rule-trust.ts       # Trust gate (pending → review → approve → reload)
│   │   ├── rules/<id>.md        # 45+ built-in detection rules (markdown + DSL)
│   │   └── metrics/<id>.metric.md # Built-in metrics referenced by rules
│   └── webview/                # Dashboard UI: app.ts plus page-*.ts per route
├── docs/
│   ├── content/                # Hugo source
│   ├── AUTHORING_RULES.md      # How to author a rule or metric (DSL + tests)
│   └── hugo.toml
├── scripts/                    # Data inventory and analysis tools
├── skills/                     # Reusable instructions for recurring agentic tasks
├── tests/e2e/                  # Playwright end-to-end tests
└── AGENTS.md                   # You are here
```

## Build, test, and ship

| Task | Command |
|---|---|
| Install dependencies | `npm ci` |
| Build the CLI + scan bundle | `npm run build` |
| Watch-mode rebuild | `npm run watch` |
| Type-check | `npm run typecheck` |
| Lint | `npm run lint` |
| Spellcheck markdown + TS | `npm run spellcheck` |
| Unit tests (vitest) | `npm test` |
| All checks (CI gate) | `npm run check` |
| End-to-end (Playwright) | `npm run test:e2e` |
| Bundle-size budget | `npm run check-size` |

CI runs `npm run check` (typecheck + lint + spellcheck + knip + lockfile-lint + test) plus the
size check on every PR. Run those locally before pushing.

## crux CLI

Build with `npm run build` (output: `dist/cli.cjs`), then run via `npm link` + `crux <command>`
or `node ./bin/run <command>`.

| Command | Description |
|---------|-------------|
| `crux scan [logDir]` | Generate a self-contained offline HTML dashboard from local session logs |
| `crux view [section]` | Print overview / patterns / flow / credits / production reports in the terminal |
| `crux context-health` | Print context-quality scores in the terminal |
| `crux skills` | Analyze repeated prompts and surface custom-skill opportunities + community catalog picks |

### `crux scan` flags

```
crux scan [logDir] [--out <dir>] [--from <date>] [--to <date>]
          [--workspace <id>] [--harness <name>] [--open]
```

`--out` defaults to `./crux-report`. The report bakes a verbatim `Session[]` snapshot and runs
the `Analyzer` client-side, so date/workspace/harness filters keep working offline. It ships five
pages: Dashboard, Timeline, Output, Patterns, Anti-Patterns.

### `crux skills` flags

```
crux skills [--workspace <id>] [--from <date>] [--to <date>] [--harness <name>]
            [--lookback <days>] [--catalog] [--install <clusterId>]
            [--install-catalog <catalogId>] [--force] [--json] [--no-color]
```

**Requires** `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY` + optional `OPENAI_BASE_URL`) in the
environment. Set `ANTHROPIC_MODEL` / `OPENAI_MODEL` to override the default model. The Skill
Finder page is also available inside `crux scan` reports — enter your key in the browser; it is
never written to disk.

## Skills

Repo-specific instructions for recurring tasks live in [`skills/`](skills/). They are symlinked
into [`.claude/skills/`](.claude/skills/) and [`.github/instructions/`](.github/instructions/)
so popular agent harnesses pick them up automatically. See
[`skills/README.md`](skills/README.md) for the authoring format.

Available today:

- [`skills/update-docs.md`](skills/update-docs.md) — author or update a Hugo doc page.

## Rule and metric authoring

Detection rules and metrics are the primary extensibility surface — markdown files with YAML
front matter and a small DSL, no code changes required.

- Built-in rules: [`src/core/rules/<id>.md`](src/core/rules/) (45+ today)
- Built-in metrics: [`src/core/metrics/<id>.metric.md`](src/core/metrics/)
- Authoring guide with annotated examples: [`docs/AUTHORING_RULES.md`](docs/AUTHORING_RULES.md)
- Trust layers (built-in / personal / project) gated through
  [`src/core/rule-trust.ts`](src/core/rule-trust.ts)

Rules ship with inline `# Tests` blocks that run as part of `npm test`.

## Workers

Heavy lifting can happen off the main thread, with a synchronous fallback when a worker is
unavailable:

- [`src/core/parse-worker.ts`](src/core/parse-worker.ts) — `logsDirs` → `progress` + `result`/`error`.
- [`src/core/warm-up-worker.ts`](src/core/warm-up-worker.ts) — `sessions` → `antiPatterns` + `configHealth`.
- [`src/core/cache-write-worker.ts`](src/core/cache-write-worker.ts) — persists the cache payload.

## Local rule trust flow

Rules move pending → review → approve → reload; edits revoke trust.

## Code style

Strict TypeScript, no `any` in new code, prefer named exports, keep heavy work off the main
thread where it would otherwise block the CLI.

```ts
// Good: typed, narrow, awaitable, off-thread.
export async function parseSessions(
  logsDirs: string[],
  onProgress: (p: LoadProgress) => void,
): Promise<ParseResult> {
  return runWorker('parse-worker', { logsDirs }, onProgress);
}

// Bad: untyped, blocks, swallows errors.
export function parseSessions(logsDirs) {
  try { return require('./parser').parseSync(logsDirs); } catch { return null; }
}
```

Rule and metric files use YAML frontmatter (`id`, `name`, `severity`, …) followed by markdown
body and an optional `# Tests` block. See [`docs/AUTHORING_RULES.md`](docs/AUTHORING_RULES.md).

## Git workflow

- Branch from `main`: `feat/<scope>`, `fix/<scope>`, `docs/<scope>`, `chore/<scope>`.
- Commits use Conventional Commits prefixes (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`,
  `test:`).
- Run `npm run check` (and `npm run test:e2e` if you touched the webview) before pushing.

## Conventions

- **No telemetry, no network calls** in core analysis paths. The optional AI features (skill
  finder, catalog ranking) call an LLM only when the user provides a key and explicitly invokes
  them.
- **Read-only with respect to user data.** crux never modifies session log files.
- **Inclusive language.** Prefer allowlist/denylist, primary/replica, etc.
- **Author over generate.** Rules and skills are markdown — write them by hand, not as opaque
  generated artifacts.

## Boundaries

✅ **Always:**

- Run `npm run check` before declaring work complete.
- Add or update inline `# Tests` blocks when changing rule or metric behavior.
- Use repo-relative markdown links so they resolve on GitHub and in the published Hugo site.

⚠️ **Ask first:**

- Adding a runtime dependency (bundle-size budget enforced by `npm run check-size`).
- Introducing a network call from a core analysis path.
- Changing the rule trust flow (`pending → review → approve → reload`) or the DSL surface.
- Renaming public commands or flags (breaks user scripts).

🚫 **Never:**

- Commit secrets, tokens, `.env` files, or anything matching `.gitignore` entries.
- Edit generated artifacts: `dist/`, `docs/public/`, `node_modules/`, `test-results/`.
- Modify files under the user's session-log directories — crux is strictly read-only with
  respect to user data.
- Add telemetry, analytics, or remote logging.
- Skip hooks (`--no-verify`) or push with failing `npm run check`.
