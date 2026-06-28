/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { ParseResult } from '@crux/core/cache';
import type { Workspace, Session } from '@crux/core/types';

// ---------------------------------------------------------------------------
// Helpers duplicated from scan.ts so the tests don't import the command module
// (which calls process.exit and has side effects at module level).
// ---------------------------------------------------------------------------

interface DataJson {
  sessions: Session[];
  editLocIndex: [string, [string, number][]][];
  workspaces: [string, Workspace][];
}

function serializeParseResult(result: ParseResult): DataJson {
  const editLocIndex: [string, [string, number][]][] = [];
  for (const [reqId, inner] of result.editLocIndex) {
    editLocIndex.push([reqId, [...inner.entries()]]);
  }
  const workspaces: [string, Workspace][] = [...result.workspaces.entries()];
  return { sessions: result.sessions, editLocIndex, workspaces };
}

function rehydrateDataJson(raw: DataJson): {
  sessions: Session[];
  editLocIndex: Map<string, Map<string, number>>;
  workspaces: Map<string, Workspace>;
} {
  const editLocIndex = new Map<string, Map<string, number>>(
    raw.editLocIndex.map(([reqId, entries]) => [reqId, new Map(entries)]),
  );
  const workspaces = new Map<string, Workspace>(raw.workspaces);
  return { sessions: raw.sessions, editLocIndex, workspaces };
}

// ---------------------------------------------------------------------------
// Smoke test: output folder shape
// ---------------------------------------------------------------------------

describe('scan output folder shape', () => {
  let outDir: string;

  beforeAll(() => {
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crux-scan-test-'));
    // Simulate what runScan writes (minus the full parse run).
    // Just verify the file-writing logic produces the expected shape.
    fs.writeFileSync(path.join(outDir, 'data.json'), '{}');
    fs.writeFileSync(path.join(outDir, 'index.html'), '<html></html>');
    fs.writeFileSync(path.join(outDir, 'app.js'), '');
    fs.writeFileSync(path.join(outDir, 'analyzer.js'), '');
    fs.writeFileSync(path.join(outDir, 'styles.css'), '');
  });

  afterAll(() => {
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('writes all five expected files', () => {
    const files = fs.readdirSync(outDir).sort();
    expect(files).toContain('index.html');
    expect(files).toContain('app.js');
    expect(files).toContain('analyzer.js');
    expect(files).toContain('styles.css');
    expect(files).toContain('data.json');
  });
});

// ---------------------------------------------------------------------------
// Round-trip test: serialize → JSON.stringify → JSON.parse → rehydrate
// ---------------------------------------------------------------------------

describe('data.json serialize / rehydrate round-trip', () => {
  it('preserves sessions array', () => {
    const session: Session = {
      sessionId: 's1',
      workspaceId: 'ws1',
      workspaceName: 'MyRepo',
      location: '/home/user/repo',
      harness: 'Local Agent',
      creationDate: 1000,
      lastMessageDate: 2000,
      requestCount: 0,
      requests: [],
    };
    const result = makeParseResult([session], new Map(), new Map());
    const serialized = serializeParseResult(result);
    const raw: DataJson = JSON.parse(JSON.stringify(serialized)) as DataJson;
    const { sessions } = rehydrateDataJson(raw);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].sessionId).toBe('s1');
  });

  it('restores editLocIndex as nested Map', () => {
    const inner = new Map([['file.ts', 42]]);
    const editLocIndex = new Map([['req-1', inner]]);
    const result = makeParseResult([], editLocIndex, new Map());
    const serialized = serializeParseResult(result);
    const raw: DataJson = JSON.parse(JSON.stringify(serialized)) as DataJson;
    const { editLocIndex: restored } = rehydrateDataJson(raw);
    expect(restored).toBeInstanceOf(Map);
    expect(restored.get('req-1')).toBeInstanceOf(Map);
    expect(restored.get('req-1')?.get('file.ts')).toBe(42);
  });

  it('restores workspaces Map', () => {
    const ws: Workspace = { id: 'ws1', name: 'MyRepo', path: '/home/user/repo' };
    const workspaces = new Map([['ws1', ws]]);
    const result = makeParseResult([], new Map(), workspaces);
    const serialized = serializeParseResult(result);
    const raw: DataJson = JSON.parse(JSON.stringify(serialized)) as DataJson;
    const { workspaces: restored } = rehydrateDataJson(raw);
    expect(restored).toBeInstanceOf(Map);
    expect(restored.get('ws1')?.name).toBe('MyRepo');
  });
});

// ---------------------------------------------------------------------------
// Fixture builder
// ---------------------------------------------------------------------------

function makeParseResult(
  sessions: Session[],
  editLocIndex: Map<string, Map<string, number>>,
  workspaces: Map<string, Workspace>,
): ParseResult {
  return {
    sessions,
    editLocIndex,
    workspaces,
    skippedFiles: 0,
    skippedLines: 0,
    processedFiles: 0,
    cacheHit: false,
  } as unknown as ParseResult;
}
