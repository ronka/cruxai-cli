# Context Health CLI — Findings & Notes

Date: 2026-06-26

Recreated the VSCode webview **Context Health** page (`src/webview/page-context-mgmt.ts`)
as a terminal-native CLI command (`crux context-health`).

## What was built

A new `crux context-health` command that reuses the **same** data source as the
webview page — `Analyzer.getContextManagement()` — so no analysis logic is
duplicated and the CLI and dashboard always agree. Output is rendered as ANSI
text instead of HTML/Chart.js.

### Sections (mirror the webview page)

- **Summary** — Context Score `/100`, Compactions, Sessions (same green/yellow/red
  thresholds: score ≥70 / ≥40; compactions 0 / >0 / >10).
- **Insights** — the analyzer's `tips`.
- **Context Utilization Trend** — weekly avg-utilization Unicode sparkline plus a
  compactions row, with degraded/limited threshold annotations. (Stands in for the
  Chart.js line chart.)
- **Per-Workspace Context Session Health** — table with the same columns as the
  webview (Workspace, Score, Verdict, AvgTok, Avg Util bar, Saturation, Compactions,
  Sessions), same sort order (`sortWorkspacesBySessions`), top 20 + "N more".
- **Session drill-down** — `--workspace <id>` adds a per-session table (Date, Harness,
  Verdict, Reqs, AvgTok, Util, Sat, Events, token-curve sparkline).

### Flags

`--workspace <id>`, `--from <date>`, `--to <date>`, `--harness <name>`,
`--json` (clean machine-readable output — status/spinner go to stderr),
`--no-color` (auto-off when piped or `NO_COLOR` is set).

### Files

- `src/cli/render/term.ts` — dependency-free ANSI / table / bar / sparkline helpers.
- `src/cli/commands/context-health.ts` — command + section renderers.
- `src/cli/index.ts` — command dispatch + usage string.
- `src/cli/commands/context-health.test.ts` — 11 tests.

### Verification

- `tsc --noEmit` clean.
- `eslint` clean.
- `npm run build` succeeds.
- `vitest run src/cli` → 15 passing.
- Ran against real local logs (249 sessions, score 78/100).

## Fix: `crux scan` now includes Context Health in the offline report

The HTML scan report was **omitting the Context Health page entirely**. Two
causes, both fixed:

1. `src/webview/dashboard-shell.ts` gated the nav item out in scan mode
   (`includeContextHealth = !scanMode`). Now always included.
2. The offline scan RPC dispatcher (`src/cli/browser/analyzer-entry.ts`) had no
   handlers for the page's RPC methods, so the tabs would have thrown
   "Unsupported RPC method in scan report". Added cases for:
   `getConfigHealth`, `getContextManagement`, `getContextRangeAvailability`,
   `getWorkspaceContextSessions` (plus a `filterParam()` helper since these pass
   the date filter wrapped as `{ filter: ... }`).

Verified in a browser against a freshly generated report: the **Context
Management** sub-tab renders Context Score, Insights, Utilization Trend, and the
per-workspace table.

### Side observation (not yet fixed)

The **Context Quality** sub-tab (the default tab, `getConfigHealth`) shows
`undefined/100 OVERALL SCORE` and `0 ACTIVE WORKSPACES` in the offline report —
its instruction-quality / agentic-readiness data appears not to be fully
available offline. The **Context Management** sub-tab (the one recreated for the
CLI) is unaffected. Worth a separate look if the Config Quality tab should be
fully populated in scan reports.

## Open issue worth a separate look (pre-existing, not introduced here)

**Verdict appears decoupled from Score / utilization.** Running against real data,
many workspaces show verdict **`limited`** despite high scores and modest
utilization. Examples observed:

| Workspace   | Score | Avg Util | Saturation | Compactions | Verdict   |
|-------------|------:|---------:|-----------:|------------:|-----------|
| openu-plus  |    94 |    32.8% |        19% |           0 | limited   |
| cruxai      |    80 |    53.2% |        46% |           0 | limited   |
| ronka       |    94 |    27.2% |        20% |           0 | limited   |

A score of 94 with ~33% average utilization, 19% saturation, and 0 compactions
reading as `limited` looks wrong.

- This is **not** a CLI rendering bug — the value comes straight from the analyzer
  (`w.verdict`), and the webview Context Health page would render the identical
  values.
- Likely source: `computeVerdict()` in `src/core/analyzer-context.ts`. The
  per-workspace verdict is an aggregate over sessions; the conditions for `limited`
  (`avgUtil > limitedUtilization`, `peakUtil >= limitedPeak`,
  `saturation >= 80 && ...`, or compaction-rate rules) don't obviously fit the
  low-utilization rows above — suggesting the workspace-level verdict aggregation
  (e.g. taking the worst session's verdict, or a peak-driven path) is dominating
  and producing a misleading label.

**Next step if pursued:** trace how the workspace-level `verdict` is derived in
`analyzeWorkspace()` vs. per-session `buildSessionContextDetail()`, and check whether
a single high-peak session is forcing the whole workspace to `limited`. Add a unit
test in `src/core/context-management.test.ts` asserting that a high-score /
low-utilization / zero-compaction workspace resolves to `optimal`.
