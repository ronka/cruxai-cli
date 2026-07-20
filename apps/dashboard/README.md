# @crux/dashboard

A manager-facing dashboard over many **Employees'** crux session analytics. Each
employee runs `crux scan --upload`, which POSTs their `data.json` to this app;
managers browse team aggregates, per-employee analytics, and comparisons.

See [`CONTEXT.md`](./CONTEXT.md) for the domain language and
[`../../plans/crux-dashboard-manager-ready.md`](../../plans/crux-dashboard-manager-ready.md)
for the build plan.

## Architecture

- **SQLite (via Drizzle)** holds identity + precomputed metadata: `employees`,
  `uploads`, `employee_summary`, and `daily_metrics`. The roster and team pages
  read only SQLite — no Analyzer per request.
- **On disk**, each employee's raw `data.json` lives at
  `<CRUX_DATA_DIR>/employees/<id>/data.json`. Per-employee detail pages rehydrate
  it into a `@crux/core` Analyzer (cached by file mtime).
- Everything the app persists is under **one directory** (`CRUX_DATA_DIR`,
  default `./crux-data`) — the SQLite file plus the per-employee data. Backing up
  the dashboard is copying that directory.

`lib/ingest.ts` is the shared precompute step (data.json → Analyzer →
`employee_summary` + `daily_metrics`); both the dev seeder and the upload route
call it, so seeded and uploaded employees are indistinguishable downstream.

## Development mode (no upload infra required)

You can develop the entire manager UI against deterministic mock data — no CLI
changes, no upload API, no server infrastructure:

```bash
pnpm install
pnpm --filter @crux/dashboard dev:seed   # create the DB + a real "you" + a mock roster
pnpm --filter @crux/dashboard dev        # http://localhost:3001
```

`dev:seed` populates `CRUX_DATA_DIR` with:

- one **real** employee, `you`, generated from a sample `data.json`, and
- **12 mock employees** across 4 roles (Developers, IT, Accountants, Designers),
  each with its own generated `data.json` so their Analyzer-backed detail pages
  work exactly like a real upload.

Mock numbers are produced by a **deterministic, name-seeded** generator
(`lib/dev/sample-data.ts`) — re-running the seed yields the same employees and
the same numbers, with no duplicate rows. Daily metrics span ~120 days, and one
mock employee (Eli Shapira) is intentionally **stale** (last upload > 7 days ago)
to exercise the needs-attention badge.

### Seeder flags

| Command | Effect |
| --- | --- |
| `dev:seed` | (Re)create the real `you` employee and the full mock roster. |
| `dev:seed --clean` | Delete **only** mock employees (rows + directories); `you` is untouched. |
| `dev:seed --force` | Allow seeding even when `NODE_ENV=production` (otherwise refused). |

## Database

Migrations are committed under `drizzle/` and applied automatically on first DB
access, so a fresh checkout needs no manual step before `dev:seed`.

```bash
pnpm --filter @crux/dashboard db:generate   # regenerate migrations from schema.ts after a schema change
pnpm --filter @crux/dashboard db:push       # push the schema straight into CRUX_DATA_DIR/crux.db
```

## Configuration

| Env var | Default | Purpose |
| --- | --- | --- |
| `CRUX_DATA_DIR` | `./crux-data` | Root of the SQLite file + per-employee data. |
