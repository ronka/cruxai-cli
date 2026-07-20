/**
 * Filesystem layout for the dashboard's on-disk store.
 *
 * Everything the dashboard persists lives under a single `CRUX_DATA_DIR` (default
 * `./crux-data`): the SQLite file plus one directory per employee holding their
 * raw `data.json`. Backing up the dashboard == copying this one directory.
 */

import path from 'node:path';

/** Root data directory. Override with `CRUX_DATA_DIR`; defaults to `./crux-data`. */
export function dataDir(): string {
  return path.resolve(process.env.CRUX_DATA_DIR ?? './crux-data');
}

/** Absolute path to the SQLite database file. */
export function dbPath(): string {
  return path.join(dataDir(), 'crux.db');
}

/** Directory holding every employee's data (`<dataDir>/employees`). */
export function employeesDir(): string {
  return path.join(dataDir(), 'employees');
}

/** Directory for a single employee (`<dataDir>/employees/<id>`). */
export function employeeDir(id: string): string {
  return path.join(employeesDir(), id);
}

/** Path to an employee's current `data.json`. */
export function employeeDataPath(id: string): string {
  return path.join(employeeDir(id), 'data.json');
}

/** Path to an employee's previous `data.json` (kept for atomic-swap safety). */
export function employeePrevDataPath(id: string): string {
  return path.join(employeeDir(id), 'data.prev.json');
}
