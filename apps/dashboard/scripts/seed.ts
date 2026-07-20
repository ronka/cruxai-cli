/**
 * Development seed — build a full multi-employee dashboard with zero upload infra.
 *
 *   pnpm --filter @crux/dashboard dev:seed           # real "you" + mock roster
 *   pnpm --filter @crux/dashboard dev:seed --clean   # remove only mock employees
 *   pnpm --filter @crux/dashboard dev:seed --force    # allow under NODE_ENV=production
 *
 * Every employee — real or mock — flows through the exact same path as a real
 * upload: a `data.json` is written to `<CRUX_DATA_DIR>/employees/<id>/` and
 * `ingest()` computes its summary + daily rows. Mock employees each get their own
 * deterministically generated `data.json` (name-derived seed), so their numbers
 * differ plausibly AND their Analyzer-backed detail pages work like the real one.
 * Re-running is idempotent: each employee is fully removed and rebuilt, so counts
 * and numbers are stable with no duplicate rows.
 */

import fs from 'node:fs';

import { eq } from 'drizzle-orm';

import { getDb, type DB } from '../src/lib/db';
import { employees } from '../src/lib/db/schema';
import { ingest } from '../src/lib/ingest';
import { employeeDataPath, employeeDir } from '../src/lib/paths';
import { generateSampleDataJson } from '../src/lib/dev/sample-data';
import { REAL_EMPLOYEE_ID } from '../src/lib/store';

const DAY_MS = 24 * 60 * 60 * 1000;

interface SeedSpec {
  id: string;
  name: string;
  role: string;
  isMock: boolean;
  /** Scales tokens/sessions so employees differ in credits & LoC. */
  intensity: number;
  /** Days of history to generate. */
  days: number;
  /** Days ago the employee last uploaded (drives the stale-upload badge). */
  lastUploadDaysAgo: number;
}

/** The mock roster: ~12 people across 4 roles, including one stale uploader. */
const MOCK_ROSTER: Array<Omit<SeedSpec, 'isMock'>> = [
  { id: 'a-cohen', name: 'Ava Cohen', role: 'Developers', intensity: 1.3, days: 120, lastUploadDaysAgo: 0 },
  { id: 'b-mizrahi', name: 'Ben Mizrahi', role: 'Developers', intensity: 0.8, days: 110, lastUploadDaysAgo: 1 },
  { id: 'c-levi', name: 'Chen Levi', role: 'Developers', intensity: 1.6, days: 120, lastUploadDaysAgo: 0 },
  { id: 'd-katz', name: 'Dana Katz', role: 'Developers', intensity: 0.6, days: 95, lastUploadDaysAgo: 2 },
  { id: 'e-shapira', name: 'Eli Shapira', role: 'Developers', intensity: 1.1, days: 120, lastUploadDaysAgo: 10 },
  { id: 'f-adar', name: 'Noa Adar', role: 'IT', intensity: 0.7, days: 100, lastUploadDaysAgo: 1 },
  { id: 'g-barak', name: 'Omri Barak', role: 'IT', intensity: 0.5, days: 90, lastUploadDaysAgo: 3 },
  { id: 'h-gold', name: 'Rina Gold', role: 'IT', intensity: 0.9, days: 115, lastUploadDaysAgo: 0 },
  { id: 'i-peretz', name: 'Sara Peretz', role: 'Accountants', intensity: 0.4, days: 90, lastUploadDaysAgo: 4 },
  { id: 'j-navon', name: 'Tal Navon', role: 'Accountants', intensity: 0.5, days: 95, lastUploadDaysAgo: 1 },
  { id: 'k-raz', name: 'Yael Raz', role: 'Designers', intensity: 0.6, days: 100, lastUploadDaysAgo: 2 },
  { id: 'l-shani', name: 'Ziv Shani', role: 'Designers', intensity: 0.8, days: 110, lastUploadDaysAgo: 0 },
];

/** Midnight UTC today — a stable anchor so same-day re-runs are identical. */
function startOfTodayMs(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/** Remove an employee's DB rows (cascade) and on-disk directory. */
function removeEmployee(db: DB, id: string): void {
  db.delete(employees).where(eq(employees.id, id)).run();
  fs.rmSync(employeeDir(id), { recursive: true, force: true });
}

/** Fully (re)create one employee from a generated `data.json`, as a real upload would. */
function seedEmployee(db: DB, spec: SeedSpec, today: number): void {
  removeEmployee(db, spec.id);

  db.insert(employees)
    .values({ id: spec.id, name: spec.name, role: spec.role, isMock: spec.isMock })
    .run();

  const anchorMs = today - spec.lastUploadDaysAgo * DAY_MS;
  const dataJson = generateSampleDataJson({ seed: spec.id, intensity: spec.intensity, days: spec.days, anchorMs });
  const serialized = JSON.stringify(dataJson);

  fs.mkdirSync(employeeDir(spec.id), { recursive: true });
  fs.writeFileSync(employeeDataPath(spec.id), serialized, 'utf8');

  ingest(spec.id, dataJson, {
    bytes: Buffer.byteLength(serialized),
    uploadedAt: new Date(anchorMs),
  });
}

/** Delete every mock employee (rows + directories); leave the real "you" intact. */
function cleanMocks(db: DB): number {
  const mocks = db.select({ id: employees.id }).from(employees).where(eq(employees.isMock, true)).all();
  for (const { id } of mocks) removeEmployee(db, id);
  return mocks.length;
}

function main(): void {
  const args = new Set(process.argv.slice(2));
  const force = args.has('--force');
  const cleanOnly = args.has('--clean');

  if (process.env.NODE_ENV === 'production' && !force) {
    console.error('Refusing to seed under NODE_ENV=production. Pass --force to override.');
    process.exit(1);
  }

  const db = getDb();

  if (cleanOnly) {
    const removed = cleanMocks(db);
    console.log(`Removed ${removed} mock employee(s). The real "${REAL_EMPLOYEE_ID}" employee is untouched.`);
    return;
  }

  const today = startOfTodayMs();

  seedEmployee(
    db,
    { id: REAL_EMPLOYEE_ID, name: 'You', role: 'Developers', isMock: false, intensity: 1, days: 120, lastUploadDaysAgo: 0 },
    today,
  );

  for (const spec of MOCK_ROSTER) {
    seedEmployee(db, { ...spec, isMock: true }, today);
  }

  const roles = new Set([...MOCK_ROSTER.map((m) => m.role), 'Developers']);
  console.log(
    `Seeded 1 real + ${MOCK_ROSTER.length} mock employees across ${roles.size} roles ` +
      `(${[...roles].join(', ')}). One mock (Eli Shapira) is stale (>7 days).`,
  );
}

main();
