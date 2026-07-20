/**
 * SQLite connection, shared process-wide.
 *
 * The database file lives at `CRUX_DATA_DIR/crux.db`. On first access the data
 * directory is created and committed migrations under `drizzle/` are applied, so
 * a fresh checkout needs no manual `drizzle-kit push` before `dev:seed`/`dev`.
 */

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { dataDir, dbPath } from './paths';
import * as schema from './db/schema';

export type DB = BetterSQLite3Database<typeof schema>;

let cached: DB | null = null;

/** Where the committed migrations live, relative to the app root. */
function migrationsFolder(): string {
  return path.join(process.cwd(), 'drizzle');
}

/** Open (once) and return the Drizzle DB handle, applying migrations on first use. */
export function getDb(): DB {
  if (cached) return cached;

  fs.mkdirSync(dataDir(), { recursive: true });
  const sqlite = new Database(dbPath());
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });

  const folder = migrationsFolder();
  if (fs.existsSync(folder)) {
    migrate(db, { migrationsFolder: folder });
  }

  cached = db;
  return db;
}

export { schema };
