# Plan: Crux Dashboard — Manager-Ready (multi-employee)

> Generated from: planning session, 2026-07-19
> Date: 2026-07-19
> Context: [apps/dashboard/CONTEXT.md](../apps/dashboard/CONTEXT.md) · Prior plan: [crux-dashboard-mvp.md](./crux-dashboard-mvp.md)

## Overview

Take `@crux/dashboard` from the single-user MVP to the CONTEXT.md end-state: a
manager-facing dashboard over many Employees. Decisions locked in planning:

- **Ingestion**: `crux scan --upload` POSTs `data.json` to the dashboard's API,
  authenticated with a **per-employee upload token**. Employees never log in.
- **Auth**: Managers log in (Auth.js); employee identity/role is assigned by an
  admin, not self-service.
- **Hosting**: Self-hosted internal server (Docker, `next start`). Storage on
  local disk + **SQLite via Drizzle** (zero extra services; Drizzle makes a later
  Postgres swap cheap).
- **Scope**: team aggregates, employee comparison, time filtering, admin UI.
- **Development mode**: a deterministic seed populates the DB with mock
  employees (Task 2), so every UI feature (Tasks 6–8) is developed without the
  upload pipeline, CLI wiring, or any storage infra.

### Architecture in one paragraph

Each employee's raw `data.json` is stored on disk at
`<CRUX_DATA_DIR>/employees/<id>/data.json` (latest upload wins; previous kept as
`data.prev.json`). SQLite holds identity + metadata: `employees` (name, role,
token hash), `uploads` (timestamp, size, session count), and a per-employee
`summary` row (sessions, requests, credits, aiLoc, flowScore, daily series)
**precomputed at upload time** by running the Analyzer once server-side. The
roster and team-aggregate pages read only SQLite — fast, no per-request Analyzer.
Per-employee detail pages (overview/timeline/patterns/anti-patterns) rehydrate
that employee's `data.json` into an Analyzer (cached in-memory keyed by
employee id + upload id) exactly as `load-report.ts` does today. Time filtering
passes the existing `DateFilter` through to Analyzer methods; the roster's
filtered numbers come from a `daily_metrics` table also written at upload time.
Because mock employees flow through the exact same tables and disk layout as
uploaded ones, nothing downstream knows or cares whether data came from Task 2's
seed or Task 3's API.

---

## Tasks

### Task 1: DB + storage spine (replaces `employees.ts` mock)

Status: done

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

Add Drizzle + better-sqlite3 to the dashboard. Schema: `employees` (id slug,
name, role, tokenHash, isMock, createdAt), `uploads` (id, employeeId,
uploadedAt, bytes, sessionCount), `employee_summary` (employeeId PK, sessions,
requests, credits, aiLoc, flowScore, dailyJson, computedAt), `daily_metrics`
(employeeId, date, sessions, requests, credits, aiLoc). `CRUX_DATA_DIR` env
(default `./crux-data`) holds the SQLite file and `employees/<id>/data.json`. A
`lib/db.ts` + `lib/store.ts` module replaces `SYNTHETIC_EMPLOYEES` /
`getEmployee` / `getRoles` with DB-backed equivalents (same shapes so pages keep
compiling). Extract the summary-precompute step (data.json → Analyzer →
`employee_summary` + `daily_metrics` rows) into a reusable
`lib/ingest.ts` function — Task 2's seeder and Task 3's upload route both call
it. Minimal seed imports the existing local `crux-report/data.json` as employee
"you" so nothing visually regresses.

#### Acceptance criteria

- [x] `pnpm drizzle-kit push` (or migration script) creates the schema in `CRUX_DATA_DIR` — both `pnpm db:push` and migrate-on-connect (`lib/db.ts`) verified
- [x] Roster page renders from DB rows, not `SYNTHETIC_EMPLOYEES` — `page.tsx` reads `listEmployees()` (force-dynamic)
- [x] `ingest(employeeId, dataJson)` is a pure library function usable from a script or a route handler — `lib/ingest.ts`
- [x] Seed imports the sample `data.json` as employee "you" and the page looks unchanged — `pnpm dev:seed`; deterministic generator at `lib/dev/sample-data.ts` (no committed `crux-report/` in this checkout, so the seed generates the sample instead)
- [x] `employees.ts` mock module deleted (also removed dead `mock-data.ts`); `Employee`/`EmployeeSummary` types now live in `store.ts`

---

### Task 2: Development mode — mock employee seeder

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

`pnpm dev:seed` (script in the dashboard app): populates the DB with ~10–15
mock employees across 3–4 roles (Developers, IT, Accountants, …), flagged
`isMock: true`. For each mock employee it copies the committed sample
`crux-report/data.json` into `employees/<id>/data.json` and runs the same
`ingest()` as a real upload — then perturbs the summary/daily rows with a
**deterministic** seeded RNG (name-derived seed, no `Math.random()` drift
between runs) so employees differ plausibly in credits, LoC, flow score, daily
shape, and last-upload age (include one stale employee > 7 days for the Task 6
badge). Because the sample data.json is on disk per employee, the
Analyzer-backed detail pages work for every mock employee too.
`pnpm dev:seed --clean` deletes all `isMock` rows and their directories and
nothing else. The seeder refuses to run when `NODE_ENV=production` unless
`--force` is passed. Document in the dashboard README: clone → `pnpm dev:seed`
→ `pnpm dev` → full multi-employee dashboard, no upload infra required.

#### Acceptance criteria

- [x] `pnpm dev:seed` from a clean checkout yields a roster of 10+ employees in 3+ roles — 1 real + 12 mock across 4 roles
- [x] Every mock employee's detail pages (overview/timeline/patterns/anti-patterns) render via the Analyzer — verified 200s + distinct numbers for `c-levi`
- [x] Re-running the seed is idempotent — same employees, same numbers, no duplicates — each employee is removed + rebuilt; row counts identical across runs
- [x] `--clean` removes only mock employees; the real "you" employee survives — verified rows + on-disk dirs
- [x] Seeder exits with an error under `NODE_ENV=production` without `--force` — exit 1 without, exit 0 with `--force`
- [x] At least one mock employee has a last-upload timestamp > 7 days old — Eli Shapira (`e-shapira`), ~11 days

**Design note:** instead of the planned "copy one committed sample + perturb summary
rows", each employee gets its own deterministically generated `data.json` (name-seeded
+ per-employee intensity). This keeps roster numbers and Analyzer-backed detail pages
consistent for every mock, which perturbing only the summary rows would not.

---

### Task 3: Upload API + summary precompute

Status: pending

- **Type**: AFK
- **Blocked by**: Task 1 (Task 2 not required — dev mode and uploads are independent consumers of `ingest()`)

#### What to build

`POST /api/upload` (route handler): Bearer token → look up employee by token
hash, reject 401 otherwise; body is gzipped or plain `data.json` (cap size,
e.g. 100 MB); validate it parses into `{sessions, editLocIndex, workspaces}`;
write atomically to `employees/<id>/data.json` (tmp + rename, previous →
`data.prev.json`); call `ingest()` to update `employee_summary` and
`daily_metrics` in the same transaction; record the `uploads` row. Reject
malformed payloads with a useful message; a failed precompute must not leave a
half-written file or stale summary.

#### Acceptance criteria

- [ ] Valid token + valid data.json → 200, file on disk, summary + daily rows updated
- [ ] Bad token → 401; malformed JSON → 400 with reason; oversized → 413
- [ ] Upload is atomic: kill mid-upload leaves the previous data.json intact
- [ ] Second upload for the same employee replaces the summary (no duplicate rows)

---

### Task 4: `crux scan --upload` in the CLI

Status: pending

- **Type**: AFK
- **Blocked by**: Task 3 (API contract), can develop against it locally

#### What to build

Add `--upload` to `crux scan`: after writing `data.json`, POST it (gzipped) to
`CRUX_UPLOAD_URL` with `Authorization: Bearer $CRUX_UPLOAD_TOKEN` (env or CLI
config file, env wins). Clear success line ("Uploaded 1,234 sessions to …") and
actionable failures (unreachable host, 401 token, 413 size). `--upload` without
the two settings configured is an immediate, explanatory error. Unit-test the
request building; integration-test against a local dashboard dev server.

#### Acceptance criteria

- [ ] `crux scan --upload` round-trips: employee appears/updates in the dashboard
- [ ] Missing URL/token → clear error naming the exact env vars
- [ ] Network/auth failures don't fail the scan itself — report and exit non-zero after the local report is written
- [ ] Docs: README section "Uploading to a team dashboard"

---

### Task 5: Manager auth

Status: pending

- **Type**: AFK
- **Blocked by**: Task 1 (needs no upload work)

#### What to build

Auth.js (NextAuth v5) with a `managers` table (email, name, passwordHash or
SSO subject). Start with the Credentials provider + a CLI/seed script to create
the first manager; keep the provider config isolated so the company's
Google/OIDC SSO can be dropped in later. Middleware protects every page and API
route except `/api/upload` (token-authed) and the login page. Session in an
HTTP-only cookie; sidebar gets the signed-in manager + sign-out. Dev
convenience: `pnpm dev:seed` (Task 2) also creates a default dev manager
(`dev@local` / documented password) so local login never blocks UI work —
same production guard as the rest of the seeder.

#### Acceptance criteria

- [ ] Unauthenticated request to any page redirects to /login
- [ ] `/api/upload` still works with only the employee token (no cookie)
- [ ] Seed script creates a manager; login/logout round-trip works
- [ ] Dev seeder provisions a dev manager; refused under `NODE_ENV=production`
- [ ] Provider config is one file, documented for the SSO swap

---

### Task 6: Team-aggregate landing page

Status: pending

- **Type**: AFK
- **Blocked by**: Task 2 (dev-mode data is all it needs; real data arrives whenever Tasks 3–4 land)

#### What to build

The manager's homepage becomes team-level: headline stats summed across
employees (sessions, requests, credits, AI LoC, mean flow score), a team daily
activity/credits chart from `daily_metrics`, cost-by-role breakdown, and
"needs attention" signals (no upload in N days, flow score outliers). The
current roster (grouped by role, `EmployeeCard` sparkline per employee) moves
below the aggregates or to `/team`. All reads from SQLite — no Analyzer on this
page. Develop entirely against the Task 2 mock roster.

#### Acceptance criteria

- [ ] Headline team stats match the sum of per-employee summaries
- [ ] Team daily chart renders from `daily_metrics` across all employees
- [ ] Stale-upload badge appears for the seeded stale mock employee
- [ ] Page renders in < 200 ms server time with 50 seeded employees

---

### Task 7: Employee comparison view

Status: pending

- **Type**: AFK
- **Blocked by**: Task 6

#### What to build

`/compare`: a sortable table of all employees (columns: sessions, requests,
credits, AI LoC, flow score, last upload), filterable by role, with a bar-chart
toggle for any column. Optional select-two side-by-side detail. Reads
`employee_summary` only. Link each row to the employee detail pages. Develop
against the Task 2 mock roster.

#### Acceptance criteria

- [ ] Sort by any column; filter by role; totals row
- [ ] Chart toggle renders ranked bars for the chosen metric
- [ ] Row click navigates to `/employee/[id]`

---

### Task 8: Time filtering

Status: pending

- **Type**: AFK
- **Blocked by**: Task 6 (roster), independent for detail pages

#### What to build

A shared date-range picker (presets: 7d / 30d / 90d / all) persisted in the URL
(`?from=&to=`). Detail pages pass the range as the existing `DateFilter` into
Analyzer calls (`getStats(f)`, `getAiCredits(f)`, …). Team/compare pages
aggregate `daily_metrics` over the range instead of reading `employee_summary`.
"All time" keeps today's fast summary path. The Task 2 seeder must spread
`daily_metrics` across ≥ 90 days so every preset shows distinct numbers.

#### Acceptance criteria

- [ ] Range picker present on team, compare, and employee pages; state survives reload via URL
- [ ] Employee detail numbers for a range match the Analyzer's DateFilter output
- [ ] Team numbers for a range equal the sum of `daily_metrics` in the range
- [ ] With seeded data, 7d / 30d / 90d presets each show different totals

---

### Task 9: Admin UI

Status: pending

- **Type**: AFK
- **Blocked by**: Tasks 3, 5

#### What to build

`/admin` (manager-only): list employees with role + last upload; create
employee (name, role) → generates an upload token shown **once** (store only
the hash) with a copyable `CRUX_UPLOAD_URL/CRUX_UPLOAD_TOKEN` snippet;
regenerate/revoke token; edit name/role; deactivate employee (hides from
roster, keeps data). Server actions with manager-session checks. Mock
employees are visibly badged "mock" in the list.

#### Acceptance criteria

- [ ] Create employee → token shown once → CLI upload with it succeeds
- [ ] Revoked token → 401 on upload
- [ ] Role edits re-group the roster immediately
- [ ] Deactivated employees excluded from team aggregates and roster
- [ ] Mock employees are labeled as such in the admin list

---

### Task 10: Deployment packaging

Status: pending

- **Type**: AFK
- **Blocked by**: Tasks 1, 3, 5 (rest can ship after)

#### What to build

Dockerfile (multi-stage, `next start`, `CRUX_DATA_DIR` as a volume),
docker-compose example, health-check route, and a `docs/` page covering:
env vars, first-manager seeding, backup story (the data dir is everything),
and reverse-proxy/TLS notes for the internal server. Production image must not
ship or run the dev seeder path.

#### Acceptance criteria

- [ ] `docker compose up` from a clean checkout serves a working dashboard
- [ ] Data survives container recreation (volume)
- [ ] `/api/health` returns 200 + DB reachable
- [ ] Setup doc takes a new operator start-to-finish

---

## Sequencing

```
Task 1 ──► Task 2 (dev seed) ──► Task 6 ──► Task 7
   │                                └─────► Task 8
   ├──► Task 3 (upload API) ──► Task 4 (CLI)
   └──► Task 5 (auth) ──┐
        Task 3 ─────────┴──► Task 9 (admin)
Tasks 1, 3, 5 ──► Task 10 (deploy)
```

**Dev-first path**: Tasks 1 → 2 → 6 → 7 → 8 build the entire manager UI against
seeded mock data — no upload API, no CLI changes, no infra. The real pipeline
(Tasks 3–4), auth (5), admin (9), and deployment (10) can land in parallel or
after, and slot in without touching the UI because mock and real data share the
same tables and disk layout.

Phase A (platform): 1, 2 — then UI development is unblocked.
Phase B (manager features): 6, 7, 8 — entirely on dev-mode data.
Phase C (pipeline + ops): 3, 4, 5, 9, 10.

## Out of scope (explicitly)

- Employee self-service accounts / employee-facing views
- Postgres, object storage, multi-tenancy — Drizzle + `CRUX_DATA_DIR` keep the seams
- Upload history/diffing beyond keeping one previous file
- Alerting/notifications (stale-upload badge only)
