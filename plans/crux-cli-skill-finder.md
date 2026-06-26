# Plan: crux CLI — Skill Finder

> Generated from: conversation (2026-06-26)
> Date: 2026-06-26
> Follows: [crux-cli-scan-migration.md](./crux-cli-scan-migration.md)

## Overview

Port the **Skill Finder** from the AI Engineer Coach VS Code extension into the **crux** CLI.
The Skill Finder analyzes a developer's repeated prompts to surface two things:

1. **Custom Skill Opportunities** — clusters of repeated prompts that could become reusable
   `SKILL.md` files, ranked by an LLM and installable to `~/.agents/skills/`.
2. **Community Skills & Agents** — items from the [awesome-copilot](https://awesome-copilot.github.com)
   catalog, ranked by an LLM against the user's actual workflow patterns, installable to
   `~/.agents/{skills,agents}/`.

It ships on **both** CLI surfaces:

- A new **terminal command** `crux skills` (ANSI output, like `crux context-health`).
- A re-enabled **Skill Finder page** in the `crux scan` HTML report (the page already exists as
  `src/webview/page-skills.ts`; it is gated off in scan mode today).

### The core problem: no `vscode.lm`

In the extension, AI triage/generation flows through the VS Code Language Model API
(`vscode.lm.selectChatModels` via `callLlm`/`callLlmJson` in `panel-llm.ts`). A CLI has no such
host. **Decision: require a bring-your-own-key LLM** — no deterministic fallback. The port
introduces a provider-agnostic LLM client that reads an API key from the environment (terminal)
or a runtime-entered field (browser report), mirroring the extension's prompts and JSON schemas
exactly.

### Locked decisions (from the Q&A)

| # | Decision | Choice |
|---|----------|--------|
| 1 | LLM strategy | **Require LLM (BYO key)** — every run needs a key; no heuristic fallback |
| 2 | Surface | **Both** — `crux skills` terminal command **and** the scan dashboard page |
| 3 | Clustering | Reuse `WorkflowAnalyzer.getWorkflowOptimization()` unchanged (pure, already CLI-safe) |
| 4 | Catalog | Reuse `panel-catalog.ts` fetch (uses `fetch`, already host-agnostic) |
| 5 | Install target | `~/.agents/skills/<slug>/SKILL.md` (custom) and `~/.agents/{skills,agents}/…` (catalog) |
| 6 | Sequencing | Additive — extension keeps building/passing throughout |

### Open questions to resolve during Task 1

- **Provider(s):** Anthropic-first (`ANTHROPIC_API_KEY`, `claude-*` default model) is the primary
  target. Decide in Task 1 whether to also support OpenAI-compatible (`OPENAI_API_KEY` +
  `OPENAI_BASE_URL`) behind the same client interface. Recommendation: ship Anthropic + an
  OpenAI-compatible escape hatch, since the client is one `fetch` either way.
- **Browser key handling:** the scan report is a static, offline `file://` bundle. The key must
  **never** be baked into the HTML. Plan: a runtime password field on the Skill Finder page,
  held in memory only (optionally `sessionStorage`), used for direct browser→provider calls
  (Anthropic supports `anthropic-dangerous-direct-browser-access: true`).

---

## Architecture

### Reuse (untouched)

- `src/core/analyzer-workflows.ts` — `WorkflowAnalyzer.getWorkflowOptimization()` clustering.
  Already pure and bundled into the scan report.
- `src/webview/panel-catalog.ts` — `getCatalogItems()` catalog fetch/parse (host-agnostic `fetch`).
- `src/webview/page-skills.ts` — the dashboard UI. Reused **as-is**; it talks only through `rpc()`.
- `src/webview/skill-cache.ts`, `styles-skills.css` — unchanged.

### New shared module (vscode-free) — `src/core/skill-finder.ts`

Extract the **prompts, JSON schemas, and result-validation** currently embedded in
`panel-request-service.ts` (`handleTriageSkills`, `handleTriageCatalog`,
`handleGenerateSkillContent`) and `panel-llm.ts` (`SCHEMA_TRIAGE`, `SCHEMA_CATALOG_PICKS`,
`UNTRUSTED_DATA_GUARD`, `spotlight`) into a pure module with **no `vscode` import**. Exposes:

- `buildTriagePrompt(clusters, context, workspace?) → { system, user, schema }`
- `validateTriage(raw, clusterSummaries) → TriagedCluster[]`
- `buildCatalogTriagePrompt(items, clusters, context, workspace?) → { system, user, schema }`
- `validateCatalogPicks(raw, items) → CatalogItem[]`
- `buildSkillContentPrompt(params) → { system, user }` + `parseSkillMarkdown(text, label) → { content, filename }`
- `safeJoinUnder` / install-path helpers (moved out of the extension's request service, or imported from a shared util).

The extension's `panel-request-service.ts` is **refactored to call these builders** and feed them
to its existing `vscode.lm` transport — so the extension behavior is unchanged but the prompt
logic is shared.

### New LLM client — `src/core/llm-client.ts`

Provider-agnostic, `fetch`-based, runs in **both Node and the browser**. Interface:

```ts
interface LlmClient {
  complete(messages: LlmMessage[]): Promise<string>;            // free text (skill content)
  completeJson<T>(messages: LlmMessage[], schema: JsonSchemaSpec): Promise<T>; // structured
}
```

- **Node:** key from `ANTHROPIC_API_KEY` (and/or `OPENAI_API_KEY`); errors clearly if absent.
- **Browser:** key injected from the runtime field; sets the direct-browser-access header.
- JSON mode uses the provider's structured-output / `response_format` where available, with a
  tolerant parse fallback (strip code fences, `JSON.parse`).

### Terminal command — `src/cli/commands/skills.ts`

Modeled on `context-health.ts`:

1. `findLogsDirs()` + `parseAllLogsAsyncDetailed()` → `Analyzer`.
2. `analyzer.getWorkflowOptimization(filter)` → clusters.
3. Build user context (languages/harnesses/topics/workspaces) — reuse the extension's
   `getUserContext()` logic, extracted to a shared helper.
4. `LlmClient.completeJson(buildTriagePrompt(...))` → strong opportunities.
5. Optional: catalog discover + `completeJson(buildCatalogTriagePrompt(...))`.
6. Render ANSI cards via `src/cli/render/term.ts` (`table`, `bold`, `color`).
7. Flags: `--workspace --from --to --harness --lookback --json --no-color --catalog`
   and an **install path**: `--install <id>` (generate + write `SKILL.md`) /
   `--install-catalog <id>`.

### Scan dashboard page — wiring in `analyzer-entry.ts`

The page (`page-skills.ts`) needs these RPCs that the scan bundle does **not** implement today:
`getWorkflowOptimization`, `triageSkills`, `discoverCatalog`, `triageCatalog`,
`generateSkillContent`, `installSkill`, `installCatalogItem`, and `getCapabilities` must report
`llm: true` once a key is entered.

- `getWorkflowOptimization` → `analyzer.getWorkflowOptimization(f)` (pure, trivial).
- `triageSkills` / `triageCatalog` / `generateSkillContent` → call the **browser** `LlmClient`
  using the runtime-entered key + shared prompt builders.
- `discoverCatalog` → `getCatalogItems()` (already browser-safe).
- `installSkill` / `installCatalogItem` → **no disk access from `file://`**. Replace disk write
  with **download the `.md`** (Blob + anchor) and/or copy-to-clipboard. `page-skills.ts` may need a
  small capability-aware tweak so the "install" button offers download in scan mode.
- Re-enable the nav item: `dashboard-shell.ts:19` currently forces `includeSkillFinder = false`
  when `scanMode`. Gate it on a new `getDashboardShellHtml({ scanMode, skillFinder: true })`
  option instead.

---

## Tasks

### Task 1: Extract shared skill-finder logic + LLM client (de-risk)

- **Type**: AFK
- **Blocked by**: None

#### What to build

The vscode-free foundation. Create `src/core/skill-finder.ts` by lifting the prompt strings,
`SCHEMA_TRIAGE`/`SCHEMA_CATALOG_PICKS`, `UNTRUSTED_DATA_GUARD`, `spotlight`, `getUserContext`,
and the result-validation out of `panel-request-service.ts` / `panel-llm.ts`. Create
`src/core/llm-client.ts` (Anthropic-first, `fetch`-based, Node+browser, env/runtime key). Refactor
the extension's `panel-request-service.ts` to consume the shared builders through its existing
`vscode.lm` transport. Decide and document the provider matrix and the browser-key approach.

#### Acceptance criteria

- [x] `src/core/skill-finder.ts` exports prompt builders + validators with **no `vscode` import**
- [x] `src/core/llm-client.ts` runs in Node (env key) and is browser-importable (no node built-ins)
- [x] `panel-request-service.ts` refactored to call the shared builders; extension behavior unchanged
- [x] Provider matrix + browser-key handling documented (in code comments or this plan)
- [x] `npm run check` passes; extension still builds

Status: done

#### Provider matrix (resolved)

| Provider | Key env var | Model env var | Notes |
|----------|-------------|---------------|-------|
| Anthropic | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` (default: `claude-sonnet-4-6`) | Structured output via tool_use |
| OpenAI-compatible | `OPENAI_API_KEY` | `OPENAI_MODEL` (default: `gpt-4.1-mini`) | `OPENAI_BASE_URL` for custom endpoints; uses `response_format` |

Auto-detection order: Anthropic first, then OpenAI-compatible. `createLlmClientFromEnv()` handles this.

**Browser key handling:** `createAnthropicClient({ apiKey, directBrowserAccess: true })` — key passed at
construction, never baked into HTML. Sets `anthropic-dangerous-direct-browser-access: true` header.
Session-only storage (never persisted) is the browser page's responsibility.

---

### Task 2: `crux skills` terminal command (read-only listing)

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

The thinnest end-to-end terminal path: parse logs → cluster → LLM triage → ANSI cards. No install
yet. Register `skills` in `src/cli/index.ts` and `USAGE`. Clear error if no API key is set.

#### Acceptance criteria

- [x] `node ./bin/run skills` parses logs and prints ranked custom skill opportunities
- [x] `--workspace --from --to --harness --lookback` map to the `DateFilter`
- [x] `--json` emits machine-readable output; `--no-color` disables ANSI
- [x] Missing/invalid API key produces a clear, actionable error (no stack trace)
- [x] Renders gracefully when there are zero qualifying clusters

Status: done

---

### Task 3: `crux skills` — catalog discovery + install

- **Type**: AFK
- **Blocked by**: Task 2

#### What to build

Add `--catalog` (fetch + LLM-rank awesome-copilot items) and the install paths: `--install <id>`
(generate `SKILL.md` via LLM, write to `~/.agents/skills/<slug>/SKILL.md`) and
`--install-catalog <id>` (fetch raw GitHub content, write under `~/.agents/`). Reuse the
extension's `safeJoinUnder` path-safety and the raw-URL allowlist from `handleInstallCatalogItem`.

#### Acceptance criteria

- [x] `--catalog` lists LLM-ranked community items with match reasons
- [x] `--install <id>` writes a generated `SKILL.md` to `~/.agents/skills/<slug>/`
- [x] `--install-catalog <id>` fetches and writes the catalog item, with the hostname/path allowlist enforced
- [x] Path traversal is rejected (reuse `safeJoinUnder`, `.md`-only)
- [x] Install prints the absolute written path; refuses to overwrite without `--force`

Status: done

---

### Task 4: Scan dashboard — wire Skill Finder RPCs + re-enable nav

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Make the existing `page-skills.ts` work inside the offline report. Add a `skillFinder` option to
`getDashboardShellHtml()` and have `scan.ts` pass it so the nav item appears. Implement the
Skill Finder RPCs in `analyzer-entry.ts` (workflow, triage, catalog, generate) using the browser
`LlmClient`. Add the runtime API-key field on the page; `getCapabilities` reports `llm:true` once a
key is present. Replace disk-install with download/clipboard in scan mode.

#### Acceptance criteria

- [x] `crux scan` report shows the Skill Finder nav item and page
- [x] Entering an API key enables Analyze; triage + catalog ranking run from the browser
- [x] No API key is ever written into `index.html` / any scan artifact
- [x] "Install" in the report downloads the `.md` (or copies it) — no `file://` fs write attempted
- [x] Page degrades clearly when no key is entered (prompts for one rather than erroring)

Status: done

---

### Task 5: Tests, check-gate, and docs

- **Type**: AFK
- **Blocked by**: Tasks 2, 3, 4

#### What to build

Lock it in. Unit-test the shared builders/validators with a mocked `LlmClient` (deterministic
fixtures — no live network in CI). Add a `skills` command smoke test (mocked LLM + fixture logs).
Wire `src/cli/commands/skills.ts` and the new core modules into `esbuild.mjs`, `knip.json`, eslint,
`tsc`, and `cspell`. Update `README` / `AGENTS.md` with the `crux skills` usage and the
`ANTHROPIC_API_KEY` requirement.

#### Acceptance criteria

- [x] `skill-finder.ts` builders/validators unit-tested against fixtures (mocked LLM)
- [x] `crux skills` smoke test asserts output shape with a mocked client
- [x] `npm run check` passes (typecheck + lint + spellcheck + knip + test)
- [x] esbuild builds the `skills` command into `dist/cli.cjs` and the RPCs into `dist/scan/analyzer.js`
- [x] README/AGENTS document the command, flags, install target, and key requirement
- [x] Extension still builds (additive change)

Status: done

---

## Sequencing notes

- **Task 1 is the keystone** — it removes the `vscode.lm` dependency and is shared by every other
  task. Do it first and well.
- **Tasks 2 & 4 both hang off Task 1** and can proceed in parallel (terminal vs. browser surface).
- **Task 3 depends on Task 2** (extends the same command).
- **Task 5 closes the loop** once all surfaces exist.
- **Additive throughout:** the extension keeps building. The refactor in Task 1 only redirects the
  extension's prompt construction to the shared module; the `vscode.lm` transport stays.

### Explicitly deferred / out of scope

- Deterministic (no-LLM) ranking — rejected per Decision 1.
- Caching LLM results to disk between `crux skills` runs.
- A `crux skills --watch` / interactive TUI picker.
- Provider auto-detection beyond env vars (e.g. reading `~/.config` credential files).
- Installing to harness-specific locations other than `~/.agents/`.
