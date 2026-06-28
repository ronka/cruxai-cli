/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { runScan } from './commands/scan';
import { runContextHealth } from './commands/context-health';
import { runSkills } from './commands/skills';
import { runView } from './commands/view';

const USAGE = `Usage:
  crux scan [--out <dir>] [--open]
  crux context-health [--workspace <id>] [--from <date>] [--to <date>] [--harness <name>] [--json] [--no-color]
  crux skills [--workspace <id>] [--from <date>] [--to <date>] [--harness <name>] [--catalog] [--json] [--no-color]
  crux view [overview|context|patterns|flow|credits|production|all] [--report <dir>] [--from <date>] [--to <date>] [--workspace <id>] [--harness <name>] [--json] [--no-color]\n`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  if (command === 'scan') {
    await runScan(args.slice(1));
  } else if (command === 'context-health') {
    await runContextHealth(args.slice(1));
  } else if (command === 'skills') {
    await runSkills(args.slice(1));
  } else if (command === 'view') {
    await runView(args.slice(1));
  } else {
    process.stderr.write(`Unknown command: ${command ?? '<none>'}\n${USAGE}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
