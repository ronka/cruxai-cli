/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Dependency-free terminal rendering helpers — ANSI color, aligned tables,
 * utilization bars, and Unicode sparklines. Mirrors the colors/thresholds used
 * by the webview Context Health page so CLI and dashboard agree. */

/** Whether ANSI color should be emitted. Honors NO_COLOR and non-TTY pipes. */
export function colorEnabled(force?: boolean): boolean {
  if (force === false) return false;
  if (force === true) return true;
  if (process.env.NO_COLOR != null && process.env.NO_COLOR !== '') return false;
  return Boolean(process.stdout.isTTY);
}

export type ColorName = 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'muted' | 'none';

/** Named ANSI 256-color codes matching the webview COLORS palette (approx). */
const ANSI: Record<Exclude<ColorName, 'none'>, number> = {
  blue: 75,    // #58a6ff
  green: 78,   // #3fb950
  purple: 141, // #bc8cff
  yellow: 178, // #d29922
  red: 203,    // #f85149
  muted: 245,  // #8b949e
};

/** Wrap text in an ANSI foreground color (no-op when disabled or 'none'). */
export function color(enabled: boolean, name: ColorName, text: string): string {
  if (!enabled || name === 'none') return text;
  return `[38;5;${ANSI[name]}m${text}[0m`;
}

export function bold(enabled: boolean, text: string): string {
  return enabled ? `[1m${text}[0m` : text;
}

/** Visible length of a string, ignoring ANSI escape sequences. */
export function visibleLen(s: string): number {
  // eslint-disable-next-line no-control-regex
  return s.replaceAll(/\[[0-9;]*m/g, '').length;
}

/** Pad a (possibly colored) cell to `width`, aligned left or right. */
export function pad(s: string, width: number, align: 'left' | 'right' = 'left'): string {
  const gap = Math.max(0, width - visibleLen(s));
  const fill = ' '.repeat(gap);
  return align === 'right' ? fill + s : s + fill;
}

export interface Column {
  header: string;
  align?: 'left' | 'right';
}

/** Render a simple aligned table. Rows are pre-formatted (may contain ANSI). */
export function table(enabled: boolean, columns: Column[], rows: string[][]): string {
  const widths = columns.map((c, i) =>
    Math.max(visibleLen(c.header), ...rows.map(r => visibleLen(r[i] ?? '')))
  );
  const sep = '  ';
  const headerLine = columns
    .map((c, i) => color(enabled, 'muted', pad(c.header, widths[i], c.align)))
    .join(sep);
  const ruleLine = color(enabled, 'muted', widths.map(w => '─'.repeat(w)).join('─'.repeat(sep.length)));
  const bodyLines = rows.map(r =>
    columns.map((c, i) => pad(r[i] ?? '', widths[i], c.align)).join(sep)
  );
  return [headerLine, ruleLine, ...bodyLines].join('\n');
}

const BAR_FILL = '█';
const BAR_EMPTY = '░';

/** A fixed-width utilization bar, e.g. `███░░░░░░░ 31.2%`, colored by zone. */
export function utilBar(enabled: boolean, pct: number, zone: ColorName, slots = 10): string {
  const clamped = Math.max(0, Math.min(100, pct));
  const filled = Math.round((clamped / 100) * slots);
  const bar = BAR_FILL.repeat(filled) + BAR_EMPTY.repeat(slots - filled);
  return `${color(enabled, zone, bar)} ${pct.toFixed(1)}%`;
}

const SPARK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/** Unicode sparkline. `null` entries render as a gap (space). `max` fixes the
 *  top of the scale; when omitted the series max is used. */
export function sparkline(values: (number | null)[], max?: number): string {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return '';
  const hi = max ?? Math.max(...valid);
  const lo = 0;
  const range = hi - lo || 1;
  return values
    .map(v => {
      if (v == null) return ' ';
      const t = Math.max(0, Math.min(1, (v - lo) / range));
      return SPARK_CHARS[Math.min(SPARK_CHARS.length - 1, Math.round(t * (SPARK_CHARS.length - 1)))];
    })
    .join('');
}
