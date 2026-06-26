/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Node-only path utilities. Not browser-importable (uses path/fs from Node). */

import * as path from 'path';

/** Characters permitted in a single user-supplied path segment. */
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

/**
 * Safely join user-supplied path segments under a trusted base directory.
 * Rejects path traversal, disallowed extensions, and empty/dot segments.
 * Returns null on any violation, the resolved absolute path on success.
 */
export function safeJoinUnder(
  baseDir: string,
  segments: string[],
  opts?: { allowedExts?: string[] },
): string | null {
  if (segments.length === 0) return null;
  for (const segment of segments) {
    if (!segment || segment === '.' || segment === '..' || !SAFE_SEGMENT.test(segment)) return null;
  }
  const finalSegment = segments[segments.length - 1];
  if (opts?.allowedExts && !opts.allowedExts.includes(path.extname(finalSegment).toLowerCase())) {
    return null;
  }
  const resolvedBase = path.resolve(baseDir);
  const resolved = path.resolve(resolvedBase, ...segments);
  if (resolved !== resolvedBase && !resolved.startsWith(resolvedBase + path.sep)) return null;
  return resolved;
}
