/**
 * Deterministic synthetic `data.json` generator for development.
 *
 * Produces a realistic `ParseResult`-shaped `DataJson` — sessions spread across
 * ~4 months, priced models, AI-authored code blocks, tokens — entirely from a
 * seeded RNG so the same profile yields the same numbers on every run (no
 * `Math.random()` drift). Task 1's seed uses it for the "you" employee; Task 2's
 * mock seeder reuses it per employee with different profiles.
 *
 * Node/dev only. Never shipped to the browser or a production image.
 */

import { createRequest, createSession } from '@crux/core';
import type { Session, SessionRequest, Workspace } from '@crux/core';

import type { DataJson } from '../data-json';

/** Models that have token pricing in `@crux/core` (so credits come out non-zero). */
const PRICED_MODELS = [
  'claude-opus-4.5',
  'claude-sonnet-4.5',
  'claude-haiku-4.5',
  'gpt-5.4',
  'gpt-5.1-codex',
  'gemini-3-pro',
] as const;

const LANGUAGES = ['ts', 'tsx', 'py', 'go', 'rs', 'sql', 'css', 'md'] as const;

const WORKSPACES = [
  { id: 'ws-web', name: 'web-app', path: '/work/web-app' },
  { id: 'ws-api', name: 'api-service', path: '/work/api-service' },
  { id: 'ws-infra', name: 'infra', path: '/work/infra' },
  { id: 'ws-mobile', name: 'mobile', path: '/work/mobile' },
] as const;

const PROMPTS = [
  'Add a feature to export the report as CSV',
  'Fix the bug where the date filter resets on reload',
  'Refactor the auth middleware to share a helper',
  'Write tests for the ingest pipeline',
  'Update the README with setup steps',
  'Style the roster cards to match the design',
  'Implement pagination for the sessions list',
  'Debug the failing upload on large payloads',
  'Create a migration for the new summary table',
  'Review this pull request and suggest improvements',
] as const;

export interface SampleProfile {
  /** Seed string (e.g. employee name/id) — drives all randomness. */
  seed: string;
  /** Days of history to span. Default 120. */
  days?: number;
  /** Scales sessions-per-active-day and tokens. 1 = baseline. Default 1. */
  intensity?: number;
  /** End of the activity window, epoch ms. Default: caller passes `Date.now()`. */
  anchorMs: number;
}

/** Small, fast, seedable PRNG (mulberry32). */
function makeRng(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Generate a deterministic `data.json` for the given profile. */
export function generateSampleDataJson(profile: SampleProfile): DataJson {
  const rng = makeRng(profile.seed);
  const days = profile.days ?? 120;
  const intensity = profile.intensity ?? 1;
  const anchor = profile.anchorMs;

  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
  const between = (lo: number, hi: number): number => lo + Math.floor(rng() * (hi - lo + 1));

  const sessions: Session[] = [];
  let reqCounter = 0;

  for (let d = days - 1; d >= 0; d--) {
    const dayStart = anchor - d * DAY_MS;
    const weekday = new Date(dayStart).getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;

    // Skip most weekends and roughly a quarter of weekdays (rest days).
    if (isWeekend && rng() > 0.2) continue;
    if (!isWeekend && rng() > 0.78) continue;

    const sessionsToday = Math.max(1, Math.round(between(1, 4) * intensity));
    for (let s = 0; s < sessionsToday; s++) {
      const workspace = pick(WORKSPACES);
      const requestsInSession = Math.max(3, Math.round(between(3, 14) * intensity));
      // Session begins during working hours (08:00–19:00 UTC).
      let cursor = dayStart + (8 + rng() * 11) * 60 * 60 * 1000;

      const requests: SessionRequest[] = [];
      const model = pick(PRICED_MODELS);
      for (let r = 0; r < requestsInSession; r++) {
        // Mostly rapid follow-ups (10s–4min); a healthy in-the-zone cadence.
        cursor += (0.17 + rng() * 3.8) * 60 * 1000;
        const prompt = pick(PROMPTS);
        const aiLines = between(8, 90);
        const inputTokens = Math.round(between(800, 6000) * intensity);
        const outputTokens = Math.round(between(300, 2200) * intensity);
        const cacheReadTokens = Math.round(inputTokens * (0.3 + rng() * 0.5));

        requests.push(
          createRequest({
            requestId: `${profile.seed}-r${reqCounter++}`,
            timestamp: Math.round(cursor),
            messageText: prompt,
            responseText: `Working on it.\n\n\`\`\`${pick(LANGUAGES)}\n// ${aiLines} lines\n\`\`\``,
            modelId: model,
            agentName: model.startsWith('claude') ? 'Claude' : 'Copilot',
            promptTokens: inputTokens,
            completionTokens: outputTokens,
            cacheReadTokens,
            cacheWriteTokens: 0,
            editedFiles: [`${workspace.path}/src/file${between(1, 40)}.${pick(LANGUAGES)}`],
            toolsUsed: rng() > 0.5 ? ['edit_file', 'read_file'] : ['read_file'],
            aiCode: [{ language: pick(LANGUAGES), loc: aiLines }],
          }),
        );
      }

      sessions.push(
        createSession({
          sessionId: `${profile.seed}-s${sessions.length}`,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          harness: model.startsWith('claude') ? 'Claude' : 'VS Code',
          endReason: 'shutdown',
          requests,
        }),
      );
    }
  }

  const usedWorkspaces = new Set(sessions.map((s) => s.workspaceId));
  const workspaces: [string, Workspace][] = WORKSPACES.filter((w) => usedWorkspaces.has(w.id)).map(
    (w) => [w.id, { id: w.id, name: w.name, path: w.path }],
  );

  // editLocIndex is left empty: aiLoc is carried by each request's `aiCode`.
  return { sessions, editLocIndex: [], workspaces };
}
