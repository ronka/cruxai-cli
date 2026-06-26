import { statSync } from 'fs';
import { join } from 'path';

const DIST_BUDGET_MB = 2;

const distPath = join(import.meta.dirname, '..', 'dist', 'cli.cjs');
try {
  const size = statSync(distPath).size;
  const mb = size / (1024 * 1024);
  console.log(`dist/cli.cjs: ${mb.toFixed(2)} MB`);
  if (mb > DIST_BUDGET_MB) {
    console.error(`❌ Bundle exceeds ${DIST_BUDGET_MB}MB budget!`);
    process.exit(1);
  }
  console.log(`✅ Within ${DIST_BUDGET_MB}MB budget`);
} catch {
  console.error('Could not check dist/cli.cjs — run npm run build first');
  process.exit(1);
}
