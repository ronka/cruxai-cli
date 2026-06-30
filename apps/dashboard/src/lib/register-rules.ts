import fs from 'node:fs';
import path from 'node:path';
import { registerBuiltinRuleSource } from '@crux/core';

let registered = false;

export function ensureBuiltinRules(): void {
  if (registered) return;
  registered = true;

  // Try candidate directories in priority order.
  // __dirname is unreliable inside webpack, so we probe with process.cwd() and node_modules symlinks.
  const cwd = process.cwd();
  const candidates = [
    // pnpm workspace: node_modules/@crux/core is a symlink to packages/core
    path.join(cwd, 'node_modules/@crux/core/src/rules'),
    // run from apps/dashboard/ — resolve up to monorepo root
    path.join(cwd, '../../packages/core/src/rules'),
    // run from monorepo root (nx dev dashboard)
    path.join(cwd, 'packages/core/src/rules'),
  ];

  let rulesDir: string | null = null;
  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate);
      rulesDir = candidate;
      break;
    } catch {
      // try next
    }
  }

  if (!rulesDir) {
    console.warn('[dashboard] Could not find built-in rules directory. Anti-patterns will be empty.');
    return;
  }

  const files = fs.readdirSync(rulesDir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const id = file.replace(/\.md$/, '');
    const source = fs.readFileSync(path.join(rulesDir, file), 'utf-8');
    registerBuiltinRuleSource(id, source);
  }
}
