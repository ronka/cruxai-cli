/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { runScan } from './commands/scan';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  if (command === 'scan') {
    await runScan(args.slice(1));
  } else {
    process.stderr.write(`Unknown command: ${command ?? '<none>'}\nUsage: crux scan [--out <dir>] [--open]\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
