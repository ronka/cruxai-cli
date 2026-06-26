/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as child_process from 'child_process';
import { findLogsDirs, parseAllLogsAsyncDetailed } from '../../core/parser';
import { getDashboardShellHtml } from '../../webview/dashboard-shell';
import { RULES_DIR_NAME } from '../../core/rule-loader';
import type { Workspace } from '../../core/types';
import type { ParseResult } from '../../core/cache';

/** On-disk rule baked into the report so the Rules tab can show user rules. */
interface BakedRule {
  id: string;
  source: string;
  filePath: string;
  layer: 'personal' | 'project';
}

/** Hard cap on rule files read from a single directory (mirrors rule-loader). */
const MAX_RULES_PER_DIR = 200;

/**
 * Read on-disk personal (~) and project (<workspace>) rule markdown so they can
 * be baked into the offline report. The browser bundle has no fs access, so the
 * Rules tab would otherwise only ever show built-in rules.
 */
function collectOnDiskRules(workspaces: Map<string, Workspace>): BakedRule[] {
  const rules: BakedRule[] = [];
  const seenDirs = new Set<string>();

  const readDir = (dir: string, layer: BakedRule['layer']): void => {
    const resolved = path.resolve(dir);
    if (seenDirs.has(resolved)) return;
    seenDirs.add(resolved);
    let files: string[];
    try {
      files = fs.readdirSync(resolved).filter(f => f.endsWith('.md')).slice(0, MAX_RULES_PER_DIR);
    } catch {
      return; // Directory doesn't exist — fine.
    }
    for (const file of files) {
      try {
        const filePath = path.join(resolved, file);
        rules.push({ id: file.replace(/\.md$/, ''), source: fs.readFileSync(filePath, 'utf-8'), filePath, layer });
      } catch { /* skip unreadable file */ }
    }
  };

  readDir(path.join(os.homedir(), RULES_DIR_NAME), 'personal');
  for (const ws of workspaces.values()) {
    if (ws.path) readDir(path.join(ws.path, RULES_DIR_NAME), 'project');
  }
  return rules;
}

/** Wire format for data.json — Maps serialized as [key, value][] arrays. */
interface DataJson {
  sessions: ParseResult['sessions'];
  editLocIndex: [string, [string, number][]][];
  workspaces: [string, Workspace][];
}

interface ScanFlags {
  out: string;
  open: boolean;
  from?: string;
  to?: string;
  workspace?: string;
  harness?: string;
}

function parseFlags(argv: string[]): ScanFlags {
  let out = './crux-report';
  let open = false;
  let from: string | undefined;
  let to: string | undefined;
  let workspace: string | undefined;
  let harness: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if ((argv[i] === '--out' || argv[i] === '-o') && argv[i + 1]) {
      out = argv[++i];
    } else if (argv[i] === '--open') {
      open = true;
    } else if (argv[i] === '--from' && argv[i + 1]) {
      from = argv[++i];
    } else if (argv[i] === '--to' && argv[i + 1]) {
      to = argv[++i];
    } else if (argv[i] === '--workspace' && argv[i + 1]) {
      workspace = argv[++i];
    } else if (argv[i] === '--harness' && argv[i + 1]) {
      harness = argv[++i];
    }
  }
  return { out, open, from, to, workspace, harness };
}

function serializeParseResult(result: ParseResult): DataJson {
  const editLocIndex: [string, [string, number][]][] = [];
  for (const [reqId, inner] of result.editLocIndex) {
    editLocIndex.push([reqId, [...inner.entries()]]);
  }
  const workspaces: [string, Workspace][] = [...result.workspaces.entries()];
  return { sessions: result.sessions, editLocIndex, workspaces };
}

/** Spin indicator for the terminal. */
function makeSpinner(): { tick: () => void; stop: () => void } {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r${frames[i++ % frames.length]} Scanning...`);
  }, 80);
  return {
    tick: () => {},
    stop: () => { clearInterval(id); process.stdout.write('\r'); },
  };
}

export async function runScan(argv: string[]): Promise<void> {
  const { out, open, from, to, workspace, harness } = parseFlags(argv);

  console.warn('\n[warn] The output folder will contain a verbatim copy of your local AI session logs,');
  console.warn('[warn] including any secrets or sensitive content present in those logs.\n');

  const logsDirs = findLogsDirs();
  if (logsDirs.length === 0) {
    console.error('No AI session log directories found. Have you used Claude Code or VS Code Copilot?');
    process.exit(1);
  }

  const spinner = makeSpinner();

  const { result } = await parseAllLogsAsyncDetailed(logsDirs, (progress) => {
    if (progress.detail) {
      process.stdout.write(`\r  ${progress.detail}                    `);
    }
  });

  spinner.stop();
  console.log(`  Found ${result.sessions.length} sessions across ${result.workspaces.size} workspace(s).`);

  // Resolve output directory and asset source directory (dist/scan/ next to cli.cjs)
  const outDir = path.resolve(out);
  fs.mkdirSync(outDir, { recursive: true });

  // dist/scan/ is built by esbuild alongside dist/cli.cjs
  const scanAssetsDir = path.join(__dirname, 'scan');

  // Write data.json
  const dataJson = serializeParseResult(result);
  const dataJsonStr = JSON.stringify(dataJson);
  fs.writeFileSync(path.join(outDir, 'data.json'), dataJsonStr, 'utf-8');

  // Copy app.js and analyzer.js from build output
  for (const asset of ['app.js', 'analyzer.js', 'styles.css']) {
    const src = path.join(scanAssetsDir, asset);
    if (!fs.existsSync(src)) {
      console.error(`Missing build artifact: ${src}\nRun \`npm run build\` first.`);
      process.exit(1);
    }
    fs.copyFileSync(src, path.join(outDir, asset));
  }

  // Collect on-disk personal/project rules so the Rules tab shows them too.
  const bakedRules = collectOnDiskRules(result.workspaces);
  if (bakedRules.length > 0) {
    console.log(`  Baked ${bakedRules.length} on-disk rule(s) into the report.`);
  }

  // Write index.html (inline data.json so it works on file:// without fetch)
  const shellHtml = getDashboardShellHtml({ scanMode: true, skillFinder: true });
  const initialFilter = { from, to, workspace, harness };
  const indexHtml = buildIndexHtml(shellHtml, dataJsonStr, initialFilter, bakedRules);
  fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml, 'utf-8');

  const indexPath = path.join(outDir, 'index.html');
  console.log(`\n  Report written to: ${outDir}`);

  if (open) {
    openBrowser(indexPath);
  } else {
    console.log(`  Open in browser:   ${indexPath}`);
  }
}

interface InitialFilter {
  from?: string;
  to?: string;
  workspace?: string;
  harness?: string;
}

function buildIndexHtml(shellHtml: string, rawDataJsonStr: string, initialFilter: InitialFilter, bakedRules: BakedRule[]): string {
  // Escape </script> so inlined content can't break out of the inline script block.
  const escapeInline = (s: string): string => s.replaceAll(/<\/script>/gi, '<\\/script>').replaceAll('<!--', '<\\!--');
  const dataJsonStr = escapeInline(rawDataJsonStr);
  const configJson = escapeInline(JSON.stringify(initialFilter));
  const rulesJson = escapeInline(JSON.stringify(bakedRules));
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>crux — AI Session Report</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
${shellHtml}
<script>window.__cruxData = ${dataJsonStr};window.__cruxConfig = ${configJson};window.__cruxRules = ${rulesJson};</script>
<script src="analyzer.js"></script>
<script src="app.js"></script>
</body>
</html>`;
}

function openBrowser(filePath: string): void {
  const url = `file://${filePath}`;
  try {
    if (process.platform === 'darwin') {
      child_process.spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'win32') {
      child_process.spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore', shell: true }).unref();
    } else {
      child_process.spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    console.log(`  Open manually: ${url}`);
  }
}
