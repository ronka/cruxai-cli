/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const CORE_SRC = path.resolve('../../packages/core/src');

/** Resolve @crux/core imports to packages/core/src */
const cruxCoreAlias = {
  name: 'crux-core-alias',
  setup(build) {
    build.onResolve({ filter: /^@crux\/core$/ }, () => ({
      path: path.join(CORE_SRC, 'index.ts'),
    }));
    build.onResolve({ filter: /^@crux\/core\// }, (args) => ({
      path: path.join(CORE_SRC, args.path.replace('@crux/core/', '') + '.ts'),
    }));
  },
};

/** Swap ./shared → shared-browser.ts so app.js dispatches locally in the scan report. */
const sharedBrowserSwap = {
  name: 'shared-browser-swap',
  setup(build) {
    build.onResolve({ filter: /^\.\/shared$/ }, (args) => {
      if (args.resolveDir.includes('webview')) {
        return { path: path.resolve('./src/browser/shared-browser.ts') };
      }
    });
  },
};

/** Stub out node-only modules so Analyzer runs in the browser bundle. */
const analyzerBrowserStubs = {
  name: 'analyzer-browser-stubs',
  setup(build) {
    build.onResolve({ filter: /\/analyzer-config$/ }, () => ({
      path: path.resolve('./src/browser/stub-analyzer-config.ts'),
    }));
    build.onResolve({ filter: /\/rule-loader$/ }, () => ({
      path: path.resolve('./src/browser/stub-rule-loader.ts'),
    }));
  },
};

/**
 * Embed the built-in markdown rule sources into the browser bundle.
 * The scan report runs entirely client-side and cannot read rules from disk,
 * so the stub rule-loader imports this virtual module and registers each source.
 * Without it, getAllRules() is empty and Anti-Patterns detects nothing.
 */
const builtinRulesVirtualModule = {
  name: 'builtin-rules-virtual-module',
  setup(build) {
    const NS = 'builtin-rules';
    build.onResolve({ filter: /^virtual:builtin-rules$/ }, () => ({
      path: 'builtin-rules', namespace: NS,
    }));
    build.onLoad({ filter: /.*/, namespace: NS }, () => {
      const rulesDir = '../../packages/core/src/rules';
      const entries = fs.readdirSync(rulesDir)
        .filter(f => f.endsWith('.md'))
        .map(f => [f.replace(/\.md$/, ''), fs.readFileSync(path.join(rulesDir, f), 'utf-8')]);
      return {
        contents: `export const BUILTIN_RULE_SOURCES = ${JSON.stringify(entries)};`,
        loader: 'js',
      };
    });
  },
};

const isWatch = process.argv.includes('--watch');

// Stamp the build time into the bundle so the UI can show which build is running.
const define = { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) };

// Bundle the warm-up worker (runs off the extension host thread)
const workerBuild = esbuild.build({
  entryPoints: ['../../packages/core/src/warm-up-worker.ts'],
  bundle: true,
  platform: 'node',
  target: 'es2022',
  format: 'cjs',
  outfile: 'dist/warm-up-worker.js',
  sourcemap: true,
  external: ['vscode'],
});

// Bundle the parse worker (runs the full parse pipeline off the extension host thread)
const parseWorkerBuild = esbuild.build({
  entryPoints: ['../../packages/core/src/parse-worker.ts'],
  bundle: true,
  platform: 'node',
  target: 'es2022',
  format: 'cjs',
  outfile: 'dist/parse-worker.js',
  sourcemap: true,
  external: ['vscode'],
});

// Bundle the cache write worker (writes cache data to disk off the main thread)
const cacheWriteWorkerBuild = esbuild.build({
  entryPoints: ['../../packages/core/src/cache-write-worker.ts'],
  bundle: true,
  platform: 'node',
  target: 'es2022',
  format: 'cjs',
  outfile: 'dist/cache-write-worker.js',
  sourcemap: true,
  external: ['vscode'],
});

// Bundle the webview script
const webviewBuild = esbuild.build({
  entryPoints: ['src/webview/app.ts'],
  bundle: true,
  platform: 'browser',
  target: 'es2022',
  format: 'iife',
  outfile: 'dist/webview/app.js',
  sourcemap: true,
  plugins: [cruxCoreAlias],
});

// CLI bundle (Node) — entry for bin/run.js
const cliBuild = esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'es2022',
  format: 'cjs',
  outfile: 'dist/cli.cjs',
  sourcemap: true,
  external: ['vscode'],
  plugins: [cruxCoreAlias],
});

// Offline scan: app.js built with shared.ts swapped to shared-browser.ts
const scanAppBuild = esbuild.build({
  entryPoints: ['src/webview/app.ts'],
  bundle: true,
  platform: 'browser',
  target: 'es2022',
  format: 'iife',
  outfile: 'dist/scan/app.js',
  sourcemap: true,
  plugins: [cruxCoreAlias, sharedBrowserSwap],
  define,
});

// Offline scan: analyzer.js browser bundle with Analyzer + local RPC dispatcher
const analyzerBrowserBuild = esbuild.build({
  entryPoints: ['src/browser/analyzer-entry.ts'],
  bundle: true,
  platform: 'browser',
  target: 'es2022',
  format: 'iife',
  outfile: 'dist/scan/analyzer.js',
  sourcemap: true,
  plugins: [cruxCoreAlias, analyzerBrowserStubs, builtinRulesVirtualModule],
});

await Promise.all([workerBuild, parseWorkerBuild, cacheWriteWorkerBuild, webviewBuild, cliBuild, scanAppBuild, analyzerBrowserBuild]);

// Copy static webview assets
const webviewDist = 'dist/webview';
fs.mkdirSync(webviewDist, { recursive: true });

// Copy rule markdown files to dist/rules/
const rulesSrc = '../../packages/core/src/rules';
const rulesDist = 'dist/rules';
fs.mkdirSync(rulesDist, { recursive: true });
if (fs.existsSync(rulesSrc)) {
  for (const file of fs.readdirSync(rulesSrc).filter(f => f.endsWith('.md'))) {
    fs.copyFileSync(path.join(rulesSrc, file), path.join(rulesDist, file));
  }
}

// Copy metric definition files to dist/metrics/
const metricsSrc = '../../packages/core/src/metrics';
const metricsDist = 'dist/metrics';
fs.mkdirSync(metricsDist, { recursive: true });
if (fs.existsSync(metricsSrc)) {
  for (const file of fs.readdirSync(metricsSrc).filter(f => f.endsWith('.metric.md'))) {
    fs.copyFileSync(path.join(metricsSrc, file), path.join(metricsDist, file));
  }
}

const cssSources = [
  'src/webview/styles.css',
  'src/webview/styles-pages.css',
  'src/webview/styles-skills.css',
  'src/webview/styles-learning.css',
];

function bundleCss() {
  const bundledCss = cssSources
    .map(source => fs.readFileSync(source, 'utf-8').trimEnd())
    .join('\n\n');
  fs.writeFileSync(path.join(webviewDist, 'styles.css'), `${bundledCss}\n`);
}

bundleCss();

// Copy bundled CSS into dist/scan/ for offline scan reports
fs.mkdirSync('dist/scan', { recursive: true });
fs.copyFileSync(path.join(webviewDist, 'styles.css'), 'dist/scan/styles.css');

console.log('Build complete.');

if (isWatch) {
  const ctx2 = await esbuild.context({
    entryPoints: ['../../packages/core/src/warm-up-worker.ts'],
    bundle: true,
    platform: 'node',
    target: 'es2022',
    format: 'cjs',
    outfile: 'dist/warm-up-worker.js',
    sourcemap: true,
    external: ['vscode'],
  });
  const ctx3 = await esbuild.context({
    entryPoints: ['../../packages/core/src/parse-worker.ts'],
    bundle: true,
    platform: 'node',
    target: 'es2022',
    format: 'cjs',
    outfile: 'dist/parse-worker.js',
    sourcemap: true,
    external: ['vscode'],
  });
  const ctx5 = await esbuild.context({
    entryPoints: ['../../packages/core/src/cache-write-worker.ts'],
    bundle: true,
    platform: 'node',
    target: 'es2022',
    format: 'cjs',
    outfile: 'dist/cache-write-worker.js',
    sourcemap: true,
    external: ['vscode'],
  });
  const ctx4 = await esbuild.context({
    entryPoints: ['src/webview/app.ts'],
    bundle: true,
    platform: 'browser',
    target: 'es2022',
    format: 'iife',
    outfile: 'dist/webview/app.js',
    sourcemap: true,
    plugins: [cruxCoreAlias],
  });
  await Promise.all([ctx2.watch(), ctx3.watch(), ctx4.watch(), ctx5.watch()]);
  for (const source of cssSources) {
    fs.watch(source, () => {
      try {
        bundleCss();
        console.log(`CSS rebuilt (${source} changed)`);
      } catch (err) {
        console.error('CSS rebuild failed:', err);
      }
    });
  }
  console.log('Watching for changes...');
}
