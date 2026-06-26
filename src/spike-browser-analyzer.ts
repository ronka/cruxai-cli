// SPIKE: throwaway — do not wire into build.
// Task 1: browser-bundle Analyzer proof-of-concept.
//
// Run:  node_modules/@esbuild/darwin-arm64/bin/esbuild src/spike-browser-analyzer.ts \
//         --bundle --platform=browser --target=es2022 --format=iife \
//         --outfile=/tmp/spike-analyzer.js [--external:path --external:fs --external:os --external:crypto]
//
// FINDINGS (2026-06-25)
// =====================
// 10 errors across 5 files, all node built-ins. Three root causes:
//
// 1. path  in analyzer.ts:8
//    Used only in warmUpViaWorker() — path.join(__dirname, 'warm-up-worker.js').
//    warmUp() / warmUpViaWorker() are never called from the browser bundle.
//    Fix: inline string op — replace path.join(__dirname, 'warm-up-worker.js')
//    with __dirname + '/warm-up-worker.js', remove the import. Zero-shim.
//
// 2. fs + path in analyzer-config.ts + config-health-helpers.ts
//    Pulled in because Analyzer constructor always builds ConfigAnalyzer.
//    Context Health is out of scope for the browser bundle.
//    Fix: esbuild `alias` — redirect './analyzer-config' to a browser stub that
//    exports ConfigAnalyzer with a no-op getConfigHealth() returning empty data.
//    getAntiPatterns() calls addPatternsSafely() which silently swallows errors,
//    so an empty stub is safe; practice-score cards still render.
//
// 3. fs + path + os in rule-loader.ts, crypto + path in rule-trust.ts
//    Pulled in via detector-registry.ts → rule-loader.ts → rule-trust.ts.
//    rule-loader loads markdown rule files from disk — out of scope for browser.
//    The plan defers the 45-rule coverage heatmap and Rule Editor explicitly.
//    Fix: esbuild `alias` — redirect './rule-loader' to a stub that exports
//    no-op registerAllBuiltinRules / loadPersonalRules / registerAllBuiltinMetrics.
//    Built-in *code* detectors (detectors.ts, detector-registry runDetectors) are
//    pure TS with zero node deps and remain active in the browser bundle.
//
// CONFIRMED CAN BE EXCLUDED:
//   analyzer-config.ts / ConfigAnalyzer / Context Health — excluded via alias stub.
//   No other in-scope path (getStats, getCodeProduction, getTimeline, getPatterns,
//   getAntiPatterns, getWorkspaces, getHarnesses) touches fs/path/os/crypto directly.
//
// VALIDATION:
//   Build with --external:path --external:fs --external:os --external:crypto → SUCCESS.
//   491 KB IIFE bundle, no errors. (External flags used for spike only; real fix is stubs.)

import { Analyzer } from './core/analyzer';
import type { Session } from './core/types';

const sessions: Session[] = [];
const a = new Analyzer(sessions);
console.log(a.getStats());
console.log(a.getCodeProduction());
console.log(a.getDayTimeline());
console.log(a.getAntiPatterns());
console.log(a.getWorkspaces());
console.log(a.getHarnesses());
