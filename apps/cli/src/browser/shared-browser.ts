/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Browser-compatible replacement for src/webview/shared.ts used by the offline scan report.
 * Swapped in at esbuild build time via plugin when building dist/scan/app.js.
 *
 * Changes from shared.ts:
 *   1. vscode: stub (no acquireVsCodeApi call)
 *   2. rpc(): dispatches to window.__cruxRpc instead of vscode.postMessage
 *   3. initMessageListener(): fires onDataReady immediately (data already loaded)
 */

// Stub so any code that imports `vscode` from shared still compiles
export const vscode = {
  postMessage: (_msg: unknown) => {},
  getState: () => null as unknown,
  setState: (_s: unknown) => {},
};

/* ---- RPC helper ---- */

declare global {
  interface Window {
    __cruxRpc?: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
    __cruxConfig?: { from?: string; to?: string; workspace?: string; harness?: string };
  }
}

export function rpc<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
  const dispatch = window.__cruxRpc;
  if (!dispatch) return Promise.reject(new Error('analyzer.js not loaded yet'));
  return dispatch(method, params) as Promise<T>;
}

export async function rpcAllSettled<T extends readonly unknown[]>(
  calls: { [K in keyof T]: Promise<T[K]> },
  fallbacks: { [K in keyof T]: T[K] },
): Promise<T> {
  const results = await Promise.allSettled(calls);
  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : fallbacks[i],
  ) as unknown as T;
}

export interface WorkerTelemetry {
  rssMB: number;
  heapUsedMB: number;
  heapLimitMB: number;
  fileBufMB: number;
  cpuPct: number;
  skippedFiles?: number;
  skippedLines?: number;
}

export function initMessageListener(
  _onProgress: (msg: { phase: number; detail?: string; pct: number; sessions?: number; linesOfCode?: number; toolCalls?: number; imagesAnalyzed?: number; filesEdited?: number; requests?: number; workspacePlan?: string[]; workspaceDone?: string; telemetry?: WorkerTelemetry }) => void,
  onDataReady: (currentWorkspace: string, skipped?: { skippedFiles: number; skippedLines: number }) => void,
): void {
  // Data is already baked in window.__cruxData — skip the loading screen and fire immediately.
  const cfg = window.__cruxConfig ?? {};
  const workspaceName = cfg.workspace ?? '';
  setTimeout(() => {
    onDataReady(workspaceName, { skippedFiles: 0, skippedLines: 0 });
    // Apply initial harness filter from CLI flags after the DOM is set up
    if (cfg.harness) {
      setTimeout(() => {
        const sel = document.getElementById('harness-filter') as HTMLSelectElement | null;
        if (sel) {
          sel.value = cfg.harness!;
          sel.dispatchEvent(new Event('change'));
        }
      }, 200);
    }
  }, 0);
}

/* ---- Chart.js import (bundled via esbuild) ---- */
import {
  Chart, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale, Tooltip, Legend,
  LineController, BarController, DoughnutController, PieController, RadarController,
  Filler,
} from 'chart.js';
import { TreemapController, TreemapElement } from 'chartjs-chart-treemap';

Chart.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale, Tooltip, Legend,
  LineController, BarController, DoughnutController, PieController, RadarController,
  Filler,
  TreemapController, TreemapElement,
);

Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--vscode-descriptionForeground').trim() || '#8b949e';
Chart.defaults.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-panel-border').trim() || '#474747';
Chart.defaults.font.family = getComputedStyle(document.documentElement).getPropertyValue('--vscode-font-family').trim() || '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

export { Chart };

/* ---- Chart instance tracking ---- */
const charts: Chart[] = [];

export function trackChart(c: Chart): void { charts.push(c); }

export function destroyCharts(): void {
  for (const c of charts) c.destroy();
  charts.length = 0;
}

export function destroyChartById(canvasId: string): void {
  const idx = charts.findIndex(c => (c.canvas).id === canvasId);
  if (idx >= 0) { charts[idx].destroy(); charts.splice(idx, 1); }
}

/* ---- DOM helpers ---- */
export function $<T extends HTMLElement = HTMLElement>(sel: string): T | null {
  return document.querySelector<T>(sel);
}
export function $$<T extends HTMLElement = HTMLElement>(sel: string): T[] {
  return Array.from(document.querySelectorAll<T>(sel));
}

export function el(tag: string, cls?: string, content?: string | SafeHtml): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (content) setHtml(e, typeof content === 'string' ? rawHtml(content) : content);
  return e;
}

/* ---- Trusted Types policy ---- */
declare global {
  interface Window { trustedTypes?: { createPolicy(name: string, rules: { createHTML(s: string): string }): TrustedTypePolicy } }
  interface TrustedTypePolicy { createHTML(s: string): TrustedHTML }
  interface TrustedHTML { toString(): string }
}

const htmlPolicy = window.trustedTypes?.createPolicy('coach-html', {
  createHTML: (s: string) =>
    s.replaceAll(/<(\/?script)/gi, '&lt;$1').replaceAll(/(javascript|vbscript|data):/gi, '$1&#58;'),
});

export function setHtml(element: Element, content: SafeHtml): void {
  const raw = content.toString();
  // eslint-disable-next-line no-unsanitized/property
  element.innerHTML = (htmlPolicy ? htmlPolicy.createHTML(raw) : raw) as unknown as string;
}

function escapeEntities(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;');
}

export function escapeHtml(s: string): string {
  return escapeEntities(s).replaceAll('\n', '<br>');
}

export function escapeAttr(s: string): string {
  return escapeEntities(s).replaceAll('\n', '&#10;');
}

const SAFE_HTML = Symbol('SAFE_HTML');
export interface SafeHtml { readonly [SAFE_HTML]: true; toString(): string }

export function rawHtml(s: string): SafeHtml {
  return { [SAFE_HTML]: true, toString: () => s };
}

/* ---- Typed safe wrappers ---- */
export function safeNumber(n: number): SafeHtml {
  if (!Number.isFinite(n)) return rawHtml('0');
  return rawHtml(String(n));
}

export function safeCssClass(cls: string): SafeHtml {
  if (!/^[a-zA-Z0-9_\-\s]*$/.test(cls)) return rawHtml('');
  return rawHtml(cls);
}

export function safeCssValue(val: string): SafeHtml {
  if (/[<>"'`;(){}]/.test(val)) return rawHtml('');
  return rawHtml(val);
}

function isSafeHtml(v: unknown): v is SafeHtml {
  return typeof v === 'object' && v !== null && (v as Record<symbol, unknown>)[SAFE_HTML] === true;
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): SafeHtml {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += renderValue(values[i]) + strings[i + 1];
  }
  return rawHtml(out);
}

function renderValue(v: unknown): string {
  if (v == null || v === false) return '';
  if (isSafeHtml(v)) return v.toString();
  if (Array.isArray(v)) return v.map(renderValue).join('');
  if (typeof v === 'number' || typeof v === 'bigint' || typeof v === 'boolean' || typeof v === 'string') {
    return escapeEntities(String(v));
  }
  if (v instanceof Date || v instanceof RegExp || v instanceof Error) {
    return escapeEntities(String(v));
  }
  if (typeof v === 'object') {
    return escapeEntities(Object.prototype.toString.call(v));
  }
  if (typeof v === 'function' || typeof v === 'symbol') {
    return escapeEntities(v.toString());
  }
  return '';
}

/* ---- Format helpers ---- */
export function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(Math.round(n));
}

export function formatMoney(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
}

export function formatDate(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/* ---- HTML builder helpers ---- */
export function statCard(label: string, value: string, accent: string): string {
  return html`<div class="stat-card"><div class="stat-card-accent" style="background:${safeCssValue(accent)}"></div>
    <div class="stat-value">${value}</div>
    <div class="stat-label">${label}</div>
  </div>`.toString();
}

export function canvasEl(id: string, height?: number, title?: string): string {
  const titleContent = title ? html`<div class="chart-title">${title}</div>` : html``;
  return html`<div class="chart-wrap">${titleContent}<canvas id="${id}" height="${safeNumber(height || 300)}"></canvas></div>`.toString();
}

export function loadingScreen(message: string): string {
  return html`<div class="loading-screen"><div class="loading-spinner"></div><div class="loading-text">${message}</div></div>`.toString();
}

/* ---- Centralized color palette ---- */
export const COLORS = {
  blue: '#58a6ff',
  green: '#3fb950',
  purple: '#bc8cff',
  yellow: '#d29922',
  red: '#f85149',
  cyan: '#79c0ff',
  orange: '#da7756',
  pink: '#f778ba',
  muted: '#8b949e',
} as const;

export const PALETTE = [COLORS.blue, COLORS.green, COLORS.purple, COLORS.yellow, COLORS.red, COLORS.cyan, COLORS.orange, COLORS.pink];

export const HARNESS_COLORS: Record<string, string> = {
  'Local Agent': '#007ACC',
  'Local Agent (Insiders)': '#24bfa5',
  'Xcode': '#147EFB',
  'GitHub Copilot CLI': '#6e40c9',
  'GitHub Copilot App': '#8957e5',
  'Claude': '#d97706',
  'Codex': '#10b981',
  'OpenCode': '#8b5cf6',
};

export function harnessColor(name: string, idx: number): string {
  return HARNESS_COLORS[name] || PALETTE[idx % PALETTE.length];
}

export const SEVERITY_COLORS: Record<string, string> = {
  high: COLORS.red,
  medium: COLORS.yellow,
  low: COLORS.green,
};

/* ---- Chart factory ---- */
type ChartType = 'bar' | 'line' | 'doughnut' | 'pie' | 'radar';

export function createChart(
  canvasId: string,
  type: ChartType,
  data: { labels: (string | number)[]; datasets: Record<string, unknown>[] },
  options?: Record<string, unknown>,
): Chart {
  const defaults: Record<string, unknown> = {
    responsive: true,
    maintainAspectRatio: false,
  };
  const c = new Chart(document.getElementById(canvasId) as HTMLCanvasElement, {
    type,
    data: data as never,
    options: { ...defaults, ...options } as never,
  });
  trackChart(c);
  return c;
}

/* ---- Score display helpers ---- */
export const SCORE_EXCELLENT = 80;
export const SCORE_GOOD = 60;
export const SCORE_FAIR = 40;
export const PROGRESS_ALMOST = 70;
export const PROGRESS_STARTED = 30;

export function scoreColor(score: number): string {
  if (score >= SCORE_EXCELLENT) return COLORS.green;
  if (score >= SCORE_GOOD) return COLORS.yellow;
  if (score >= SCORE_FAIR) return COLORS.orange;
  return COLORS.red;
}

export function scoreLabel(score: number, variant: 'dashboard' | 'antipatterns' = 'dashboard'): string {
  if (variant === 'antipatterns') {
    if (score >= SCORE_EXCELLENT) return 'Great';
    if (score >= SCORE_GOOD) return 'Good';
    if (score >= SCORE_FAIR) return 'Fair';
    return 'Needs Work';
  }
  if (score >= SCORE_EXCELLENT) return 'Excellent';
  if (score >= SCORE_GOOD) return 'Good';
  if (score >= SCORE_FAIR) return 'Needs Work';
  return 'Critical';
}

export function ringHtml(score: number, color: string, size: number): string {
  const r = (size - 6) / 2;
  const c = Math.PI * 2 * r;
  const offset = c - (score / 100) * c;
  const fontSize = size > 80 ? 22 : size > 60 ? 20 : 14;
  return html`<svg class="score-ring" width="${safeNumber(size)}" height="${safeNumber(size)}" viewBox="0 0 ${safeNumber(size)} ${safeNumber(size)}">
    <circle cx="${safeNumber(size / 2)}" cy="${safeNumber(size / 2)}" r="${safeNumber(r)}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="5"/>
    <circle cx="${safeNumber(size / 2)}" cy="${safeNumber(size / 2)}" r="${safeNumber(r)}" fill="none" stroke="${safeCssValue(color)}" stroke-width="5"
      stroke-dasharray="${safeNumber(c)}" stroke-dashoffset="${safeNumber(offset)}" stroke-linecap="round"
      transform="rotate(-90 ${safeNumber(size / 2)} ${safeNumber(size / 2)})"/>
    <text x="${safeNumber(size / 2)}" y="${safeNumber(size / 2)}" text-anchor="middle" dominant-baseline="central"
      fill="${safeCssValue(color)}" font-size="${safeNumber(fontSize)}" font-weight="700">${safeNumber(score)}</text>
  </svg>`.toString();
}

export function pctBadge(pct: number, label: string): string {
  if (pct === 0) return html`<span class="trend-badge trend-stable">${label} 0%</span>`.toString();
  const cls = pct > 0 ? 'trend-improving' : 'trend-worsening';
  const sign = pct > 0 ? '+' : '';
  return html`<span class="trend-badge ${safeCssClass(cls)}">${rawHtml(sign)}${safeNumber(pct)}% ${label}</span>`.toString();
}

/* ---- Error Boundary ---- */
export function withErrorBoundary(
  pageName: string,
  container: HTMLElement,
  render: () => void | Promise<void>,
): void {
  try {
    const result = render();
    if (result instanceof Promise) {
      result.catch((err: unknown) => {
        showErrorFallback(pageName, container, err);
      });
    }
  } catch (err: unknown) {
    showErrorFallback(pageName, container, err);
  }
}

function showErrorFallback(pageName: string, container: HTMLElement, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  setHtml(container, html`
    <div class="error-boundary">
      <h3>⚠️ Failed to render ${pageName}</h3>
      <p class="error-message">${message}</p>
      <p class="error-hint">Try re-running \`crux scan\` to regenerate the report.</p>
    </div>`);
}
