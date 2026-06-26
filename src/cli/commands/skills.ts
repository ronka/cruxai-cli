/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Terminal-native Skill Finder — parses AI session logs, clusters repeated prompts,
 * and uses an LLM to surface custom skill opportunities from the developer's workflow. */

import * as fs from 'fs';
import * as path from 'path';
import { findLogsDirs, parseAllLogsAsyncDetailed } from '../../core/parser';
import { Analyzer } from '../../core/analyzer';
import type { DateFilter } from '../../core/types';
import {
  getUserContext,
  buildClusterSummaries,
  buildTriagePrompt,
  validateTriage,
  buildCatalogTriagePrompt,
  validateCatalogPicks,
  buildSkillContentPrompt,
  parseSkillMarkdown,
  SCHEMA_TRIAGE,
  SCHEMA_CATALOG_PICKS,
  type TriagedCluster,
  type RankedCatalogItem,
  type ClusterSummary,
} from '../../core/skill-finder';
import { createLlmClientFromEnv } from '../../core/llm-client';
import { safeJoinUnder } from '../../core/path-utils';
import { getCatalogItems } from '../../webview/panel-catalog';
import { readTextWithByteLimit } from '../../webview/fetch-utils';
import { colorEnabled, color, bold, type ColorName } from '../render/term';

const CATALOG_MAX_BYTES = 1024 * 1024;

const ALLOWED_CATALOG_HOSTNAME = 'raw.githubusercontent.com';
const ALLOWED_CATALOG_PATH_PREFIX = '/github/awesome-copilot/';

interface SkillsFlags {
  filter: DateFilter;
  workspace?: string;
  json: boolean;
  noColor: boolean;
  catalog: boolean;
  install?: string;
  installCatalog?: string;
  force: boolean;
}

function parseFlags(argv: string[]): SkillsFlags {
  const filter: DateFilter = {};
  let workspace: string | undefined;
  let json = false;
  let noColor = false;
  let catalog = false;
  let install: string | undefined;
  let installCatalog: string | undefined;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--from' && argv[i + 1]) filter.fromDate = argv[++i];
    else if (a === '--to' && argv[i + 1]) filter.toDate = argv[++i];
    else if ((a === '--workspace' || a === '--lookback') && argv[i + 1]) {
      workspace = argv[++i];
      if (a === '--workspace') filter.workspaceId = workspace;
    }
    else if (a === '--harness' && argv[i + 1]) filter.harness = argv[++i];
    else if (a === '--json') json = true;
    else if (a === '--no-color') noColor = true;
    else if (a === '--catalog') catalog = true;
    else if (a === '--install' && argv[i + 1]) install = argv[++i];
    else if (a === '--install-catalog' && argv[i + 1]) installCatalog = argv[++i];
    else if (a === '--force') force = true;
  }

  return { filter, workspace, json, noColor, catalog, install, installCatalog, force };
}

function makeSpinner(): { stop(): void } {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const id = setInterval(() => {
    process.stderr.write(`\r${frames[i++ % frames.length]} Scanning...`);
  }, 80);
  return { stop: () => { clearInterval(id); process.stderr.write('\r'); } };
}

// ─── ANSI rendering ───────────────────────────────────────────────────────────

function verdictColor(verdict: string): ColorName {
  if (verdict === 'strong') return 'green';
  if (verdict === 'maybe') return 'yellow';
  return 'muted';
}

function renderSkillCard(cluster: TriagedCluster, enabled: boolean): string {
  const name = cluster.suggestedSkillName
    ? ` ${color(enabled, 'muted', '→')} ${color(enabled, 'blue', cluster.suggestedSkillName)}`
    : '';
  const lines = [
    `  ${bold(enabled, color(enabled, verdictColor(cluster.verdict), '●'))} ${bold(enabled, cluster.label)}${name}`,
    `    ${color(enabled, 'muted', cluster.reason)}`,
  ];
  return lines.join('\n');
}

function renderCatalogCard(item: RankedCatalogItem, enabled: boolean): string {
  const kind = color(enabled, 'purple', item.kind.toUpperCase());
  const reason = item.matchReasons[0] ?? '';
  return [
    `  ${bold(enabled, color(enabled, 'blue', '◆'))} ${bold(enabled, item.title)} ${color(enabled, 'muted', `[${kind}]`)}`,
    `    ${color(enabled, 'muted', reason)}`,
  ].join('\n');
}

function renderEmptyState(enabled: boolean): string {
  return [
    '',
    bold(enabled, '  No Skill Opportunities Found'),
    color(enabled, 'muted', '  Not enough repeated patterns detected in your AI session logs.'),
    color(enabled, 'muted', '  Use AI coding tools more to generate data, or widen the date filter.'),
    '',
  ].join('\n');
}

export function renderSkillsReport(
  triaged: TriagedCluster[],
  catalogItems: RankedCatalogItem[],
  enabled: boolean,
): string {
  const strong = triaged.filter(t => t.verdict === 'strong');
  if (strong.length === 0 && catalogItems.length === 0) return renderEmptyState(enabled);

  const sections: string[] = [''];

  if (strong.length > 0) {
    sections.push(bold(enabled, '  Custom Skill Opportunities'));
    sections.push(color(enabled, 'muted', '  Repeated workflow patterns from your AI session history.'));
    sections.push('');
    for (const cluster of strong) {
      sections.push(renderSkillCard(cluster, enabled));
    }
  }

  if (catalogItems.length > 0) {
    if (strong.length > 0) sections.push('');
    sections.push(bold(enabled, '  Community Skills & Agents'));
    sections.push(color(enabled, 'muted', '  Items from the awesome-copilot catalog matched to your workflow.'));
    sections.push('');
    for (const item of catalogItems) {
      sections.push(renderCatalogCard(item, enabled));
    }
  }

  sections.push('');
  return sections.join('\n');
}

// ─── Install helpers ──────────────────────────────────────────────────────────

function agentsBaseDir(): string {
  const home = process.env['HOME'] ?? process.env['USERPROFILE'] ?? '';
  if (!home) throw new Error('Cannot determine home directory');
  return path.join(home, '.agents');
}

async function installCustomSkill(
  clusterId: string,
  clusterSummaries: ClusterSummary[],
  llmClient: Awaited<ReturnType<typeof createLlmClientFromEnv>>,
  force: boolean,
): Promise<void> {
  const cluster = clusterSummaries.find(c => c.id === clusterId);
  if (!cluster) {
    throw new Error(`No cluster found with id "${clusterId}". Run without --install to list opportunities.`);
  }

  process.stderr.write('  Generating SKILL.md content...\n');
  const { system, user } = buildSkillContentPrompt({
    label: cluster.label,
    pattern: cluster.label,
    occurrences: cluster.occurrences,
    sessions: cluster.sessions,
    examples: cluster.examples,
    skillDraft: '',
  });

  const text = await llmClient.complete([{ role: 'user', content: system }, { role: 'user', content: user }]);
  const { content, filename } = parseSkillMarkdown(text, cluster.label);

  const segments = filename.split('/');
  const targetPath = safeJoinUnder(path.join(agentsBaseDir(), 'skills'), segments, { allowedExts: ['.md'] });
  if (!targetPath) throw new Error(`Invalid install path for "${filename}"`);

  if (fs.existsSync(targetPath) && !force) {
    throw new Error(`File already exists: ${targetPath}\nUse --force to overwrite.`);
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
  process.stdout.write(`Installed: ${targetPath}\n`);
}

async function installCatalogSkill(
  catalogId: string,
  force: boolean,
): Promise<void> {
  const rawCatalog = await getCatalogItems();
  const item = rawCatalog.find(i => i.id === catalogId);
  if (!item) {
    throw new Error(`No catalog item found with id "${catalogId}". Run with --catalog to list options.`);
  }

  const catalogPath = item.path;
  if (!catalogPath || catalogPath.includes('..') || catalogPath.startsWith('/')) {
    throw new Error('Invalid catalog item path');
  }

  const rawUrl = `https://${ALLOWED_CATALOG_HOSTNAME}${ALLOWED_CATALOG_PATH_PREFIX.replace(/\/$/, '')}main/${catalogPath}`;
  const parsedUrl = new URL(rawUrl);
  if (parsedUrl.hostname !== ALLOWED_CATALOG_HOSTNAME || !parsedUrl.pathname.startsWith(ALLOWED_CATALOG_PATH_PREFIX)) {
    throw new Error('Invalid catalog URL');
  }

  const response = await fetch(parsedUrl.toString(), { redirect: 'error' });
  if (!response.ok) throw new Error(`Failed to fetch catalog item: ${response.status}`);
  const content = await readTextWithByteLimit(response, CATALOG_MAX_BYTES, 'Catalog item too large');

  const subDir = item.kind === 'agent' ? 'agents' : 'skills';
  const slug = item.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/-+/g, '-').replaceAll(/^-|-$/g, '');
  const filename = catalogPath.split('/').pop() ?? `${slug}.md`;
  const segments = [slug, filename];

  const targetPath = safeJoinUnder(path.join(agentsBaseDir(), subDir), segments, { allowedExts: ['.md'] });
  if (!targetPath) throw new Error(`Invalid install path`);

  if (fs.existsSync(targetPath) && !force) {
    throw new Error(`File already exists: ${targetPath}\nUse --force to overwrite.`);
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
  process.stdout.write(`Installed: ${targetPath}\n`);
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function runSkills(argv: string[]): Promise<void> {
  const flags = parseFlags(argv);

  const logsDirs = findLogsDirs();
  if (logsDirs.length === 0) {
    console.error('No AI session log directories found. Have you used Claude Code or VS Code Copilot?');
    process.exit(1);
  }

  const spinner = makeSpinner();
  const { result } = await parseAllLogsAsyncDetailed(logsDirs, (progress) => {
    if (progress.detail) process.stderr.write(`\r  ${progress.detail}                    `);
  });
  spinner.stop();

  const analyzer = new Analyzer(result.sessions, result.editLocIndex, result.workspaces);
  const workflowData = analyzer.getWorkflowOptimization(flags.filter);

  if (workflowData.clusters.length === 0) {
    if (flags.json) {
      process.stdout.write(JSON.stringify({ opportunities: [], catalog: [] }, null, 2) + '\n');
      return;
    }
    const enabled = colorEnabled(flags.noColor ? false : undefined);
    process.stdout.write(renderEmptyState(enabled) + '\n');
    return;
  }

  // --install-catalog doesn't need log parsing or LLM triage
  if (flags.installCatalog) {
    try {
      await installCatalogSkill(flags.installCatalog, flags.force);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
    return;
  }

  const context = getUserContext(result.sessions);
  const clusterSummaries = buildClusterSummaries(workflowData.clusters);

  let llmClient;
  try {
    llmClient = createLlmClientFromEnv();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(msg);
    process.exit(1);
  }

  // --install <id>: generate and write SKILL.md for a given cluster id
  if (flags.install) {
    try {
      await installCustomSkill(flags.install, clusterSummaries, llmClient, flags.force);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
    return;
  }

  process.stderr.write('  Analyzing workflow patterns...\n');
  const { system: triageSystem, user: triageUser } = buildTriagePrompt(clusterSummaries, context, flags.workspace);
  let triaged: TriagedCluster[];
  try {
    const raw = await llmClient.completeJson<unknown>(
      [{ role: 'user', content: triageSystem }, { role: 'user', content: triageUser }],
      SCHEMA_TRIAGE,
    );
    triaged = validateTriage(raw, clusterSummaries);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LLM triage failed';
    console.error(`Error: ${msg}`);
    process.exit(1);
  }

  let catalogItems: RankedCatalogItem[] = [];
  if (flags.catalog) {
    process.stderr.write('  Fetching community catalog...\n');
    try {
      const rawCatalog = await getCatalogItems();
      const candidates = rawCatalog.map(item => ({
        id: item.id,
        kind: item.kind,
        title: item.title,
        description: item.description.slice(0, 120),
        category: item.category,
        path: item.path,
        url: item.url,
      }));
      const { system: catSystem, user: catUser } = buildCatalogTriagePrompt(
        candidates, clusterSummaries, context, flags.workspace,
      );
      process.stderr.write('  Ranking catalog items...\n');
      const catRaw = await llmClient.completeJson<unknown>(
        [{ role: 'user', content: catSystem }, { role: 'user', content: catUser }],
        SCHEMA_CATALOG_PICKS,
      );
      catalogItems = validateCatalogPicks(catRaw, rawCatalog);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Catalog triage failed';
      process.stderr.write(`  Warning: ${msg}\n`);
    }
  }

  if (flags.json) {
    process.stdout.write(JSON.stringify({
      opportunities: triaged.filter(t => t.verdict === 'strong'),
      catalog: catalogItems,
    }, null, 2) + '\n');
    return;
  }

  const enabled = colorEnabled(flags.noColor ? false : undefined);
  process.stdout.write(renderSkillsReport(triaged, catalogItems, enabled) + '\n');
}
