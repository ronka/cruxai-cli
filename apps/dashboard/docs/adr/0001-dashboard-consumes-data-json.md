# Dashboard consumes scan's data.json via @crux/core

The `@crux/dashboard` Next.js app renders analytics by reading the `data.json`
that `crux scan` writes, rehydrating it, and running `@crux/core`'s `Analyzer`
server-side — rather than reusing the offline report's webview code or
re-parsing raw session logs.

We chose `data.json` because it is the stable producer/consumer contract between
scan and any viewer, and `@crux/core` is fs-free and runs equally well in a Next
Server Component. The offline webview was rejected as a base: it is coupled to
the CLI bundle (custom html-tag templating, Chart.js canvas, local RPC) and not
reusable as React. Re-parsing logs was rejected: it needs worker threads and fs
access on every load and duplicates what scan already did.

## Consequences

- There are now **two view layers** over the same data — the CLI's offline
  webview and the Next dashboard — that must be kept visually in sync by hand.
  This is the deliberate cost of a hosted, multi-user dashboard styled
  independently of the CLI report.
- Patterns and Anti-Patterns require registering the built-in rule markdown
  (`packages/core/src/rules/*.md`) server-side before running the
  detectors/`getAntiPatterns`; the dashboard owns that wiring (the CLI does it
  via fs in the Node path and via an esbuild virtual module in the browser).
- The future shared-bucket / multi-employee model swaps only the *source* of
  `data.json` (bucket fetch instead of local fs); the Analyzer pipeline stays.
