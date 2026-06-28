/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defineConfig } from 'vitest/config';
import path from 'node:path';

const CORE_SRC = path.resolve('./packages/core/src');

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@crux\/core\/(.+)$/, replacement: `${CORE_SRC}/$1` },
      { find: '@crux/core', replacement: `${CORE_SRC}/index.ts` },
    ],
  },
  test: {
    include: ['apps/cli/src/**/*.test.ts', 'packages/core/src/**/*.test.ts'],
    environment: 'node',
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      include: ['packages/core/src/**/*.ts'],
      exclude: [
        'apps/cli/src/**/*.test.ts',
        'packages/core/src/**/*.test.ts',
        'src/webview/**',
        'src/extension.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
      reporter: ['text', 'text-summary'],
    },
  },
});
