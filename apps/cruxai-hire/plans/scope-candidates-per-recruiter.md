## Plan: Scope candidates per recruiter

> Generated from: conversation (bug audit on candidate cross-recruiter leak)
> Date: 2026-05-30

## Overview

Today every recruiter sees every candidate. The `candidates` table has no owner column, and `candidatesRouter` plus `invitesRouter` query/return rows without filtering by `ctx.user.id`. This plan adds `owner_id` to candidates, scopes every candidate-touching procedure (direct and indirect), eliminates the global-email uniqueness oracle, and adds regression tests so a recruiter cannot read, mutate, dedupe-against, or enumerate another recruiter's candidates.

**Backfill policy (confirmed):** all existing candidate rows are assigned `owner_id = 'oF6JJgGWc4ewWqaIQuSKwZIv4IPYfdl0'` (designated admin). This is the safe escape hatch — it does not actually isolate historical data, but it unblocks the schema change without resolving multi-recruiter shared rows. Historical cross-recruiter visibility on pre-migration rows is accepted as known debt.

---

## Tasks

### Task 1: Add `owner_id` to candidates (schema + backfill)

Status: done

- **Type**: HITL
- **Blocked by**: None - can start immediately

#### What to build

A Drizzle migration that:

1. Adds `owner_id TEXT` to `candidates` (initially nullable so backfill can run).
2. Backfills every existing row with `owner_id = 'oF6JJgGWc4ewWqaIQuSKwZIv4IPYfdl0'`.
3. Alters `owner_id` to `NOT NULL`.
4. Drops the existing unique constraint on `email` and replaces it with a composite unique on `(owner_id, email)`. This removes the cross-recruiter email-existence oracle and lets the same email exist under two owners.

The schema file `src/server/db/schema/candidates.ts` is updated to match. No service or router changes ship in this slice — services keep compiling because `owner_id` is not yet read. Migration is written using the existing `drizzle/` workflow (see `0007_submission_user_identity.sql` for prior format).

HITL because the maintainer should manually verify the migration on a database snapshot before merging — the unique-constraint swap is irreversible against live data.

#### Acceptance criteria

- [ ] New migration file under `drizzle/` adds `owner_id`, backfills with the admin id, sets `NOT NULL`, swaps the unique constraint.
- [ ] `src/server/db/schema/candidates.ts` declares `ownerId: text('owner_id').notNull()` and the composite unique.
- [ ] `npm run lint` passes; `drizzle-kit` reports no schema/migration drift.
- [ ] Manual: against a staging snapshot, all existing rows have `owner_id` set and inserting `(admin_id, existing_email)` fails while `(other_owner_id, existing_email)` succeeds.

#### User stories addressed

- As a platform operator, I need a non-null owner on every candidate so downstream code can rely on it.

---

### Task 2: Scope `candidatesRouter` + service by `ownerId`

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Every function in `src/server/services/candidates.ts` takes `ownerId` and includes `eq(candidates.ownerId, ownerId)` in its SQL `WHERE` clause (not a post-fetch JS check):

- `listCandidates({ ownerId })`
- `getCandidateById(id, { ownerId })`
- `getCandidateByEmail(email, { ownerId })`
- `createCandidate({ ..., ownerId })`
- `updateCandidate(id, updates, { ownerId })`
- `deleteCandidate(id, { ownerId })`

Every procedure in `src/server/trpc/routers/candidates.ts` passes `ctx.user.id` as `ownerId`. `byId`/`update`/`delete` return `NOT_FOUND` (not `FORBIDDEN`) when the row isn't owned by the caller, to avoid leaking existence.

The frontend dedupe in `src/app/recruiters/page.tsx:90` keeps working because `useCandidatesQuery` now returns only the recruiter's own rows. No UI changes required.

#### Acceptance criteria

- [ ] All service functions require `ownerId` and apply it in the SQL `WHERE` clause.
- [ ] All five procedures pass `ctx.user.id`.
- [ ] Manually verified: signing in as recruiter A and calling `candidates.list` returns only A's rows; `candidates.byId` on a B-owned candidate returns `NOT_FOUND`; `candidates.update`/`delete` on a B-owned id is a no-op (`NOT_FOUND`).
- [ ] `npm run lint` passes.

#### User stories addressed

- As a recruiter, I see only candidates I created.
- As a recruiter, I cannot read or modify another recruiter's candidate via direct id.

---

### Task 3: Scope `invitesRouter` + service by recruiter

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

The invite path is the indirect candidate-leak vector. Today `invitesRouter.list`, `byId`, `delete`, and `create` are unscoped recruiter procedures. Scope them via the chain `invite → role.ownerId` (and verify `question.ownerId` matches `ctx.user.id` on create):

- `listInvites({ ownerId, ...filters })` — `INNER JOIN job_roles ON role_id = job_roles.id WHERE job_roles.owner_id = ownerId`.
- `getInviteById(id, { ownerId })` — same join, returns `null` when not owned.
- `deleteInvite(id, { ownerId })` — pre-check ownership via `getInviteById`; abort if not owned. Use the existing `eq`/`and` patterns.
- `createInvite({ ..., ownerId })` — verify the supplied `roleId`, `questionId`, and `candidateId` are all owned by `ownerId` before insert. Reject with `FORBIDDEN` otherwise.

Public-facing procedures (`byCode`, `session`, `start`) stay as-is — they are the candidate flow and intentionally do not require a session.

In-memory filtering inside `listInvites` (`rows.filter(...)`) is replaced with SQL predicates so the ownership filter is enforced at the database, not the application.

#### Acceptance criteria

- [ ] `listInvites` / `getInviteById` / `deleteInvite` / `createInvite` all require `ownerId`.
- [ ] Ownership filter is applied as a SQL `WHERE`, not a post-fetch JS check.
- [ ] `createInvite` rejects when any of `candidateId` / `roleId` / `questionId` is not owned by the caller.
- [ ] Manually verified: recruiter A cannot list, read by id, or delete an invite created by recruiter B; the candidate-facing `byCode` flow is unaffected.

#### User stories addressed

- As a recruiter, I see only invites tied to my roles/questions.
- As a recruiter, I cannot delete or read another recruiter's invites.

---

### Task 4: Audit `question-resolver` candidate exposure

Status: done

- **Type**: AFK
- **Blocked by**: Task 2

#### What to build

`src/server/question-resolver.ts` calls `getCandidateById` in the candidate-facing invite landing flow. The new `getCandidateById` signature requires `ownerId` — decide and implement the right call site:

- **Preferred**: bypass the owner check here using a dedicated `getCandidateByIdForInviteFlow(id)` (or inline query) that returns only the fields a candidate needs (`name`), never `notes`. Document why the bypass is safe (caller is the anonymous invite flow; access is gated by knowledge of `invite_code`).
- Audit the returned payload of `resolveInviteCode` and confirm no recruiter-private candidate fields (`notes`, `createdAt`) reach the candidate.

Also re-run the existing test at `src/server/__tests__/question-resolver.test.ts` and update it to match.

#### Acceptance criteria

- [ ] `question-resolver.ts` uses a dedicated lookup whose return shape excludes recruiter-only fields.
- [ ] `resolveInviteCode` output, when serialized, contains only candidate-safe fields.
- [ ] Existing question-resolver tests pass; one new assertion confirms `notes` is not in the candidate-facing payload.

#### User stories addressed

- As a candidate using an invite link, I do not see recruiter-private notes about me.

---

### Task 5: Server-side dedupe in invite creation

Status: done

- **Type**: AFK
- **Blocked by**: Task 2, Task 3

#### What to build

Move candidate-by-email dedupe from the client (`src/app/recruiters/page.tsx:90`) into the server. When a recruiter creates a candidate via `candidates.create` or an invite-with-new-candidate flow:

- Server looks up `(email, ownerId)` via `getCandidateByEmail(email, { ownerId })`.
- If found → return the existing row.
- If not found → insert a new row owned by `ownerId`.

This guarantees: (a) two recruiters can independently have a candidate with the same email and each get their own row; (b) the client cannot bypass the dedupe by skipping the pre-check. Remove the client-side `candidates.find(...)` block in `recruiters/page.tsx` and rely on the server contract.

If the server is going to silently dedupe vs. error on duplicate, return a discriminator (`{ candidate, created: boolean }`) so the UI can show "Added X" vs "X already in your pipeline."

#### Acceptance criteria

- [ ] Client-side `candidates.find(...)` dedupe in `recruiters/page.tsx` is removed.
- [ ] `candidates.create` (or a new `candidates.upsertByEmail`) handles dedupe server-side, scoped to `ctx.user.id`.
- [ ] UI shows distinct success/already-exists feedback based on the server response.
- [ ] Manually verified: two recruiters creating the same email each end up with their own owned row.

#### User stories addressed

- As a recruiter, when I add a candidate with an email another recruiter has used, I get my own copy.
- As a recruiter, I cannot enumerate other recruiters' candidate emails via the dedupe path.

---

### Task 6: Cross-recruiter isolation regression tests

Status: done

- **Type**: AFK
- **Blocked by**: Task 2, Task 3, Task 4, Task 5

#### What to build

Add an integration test (using whichever runner gets introduced — see `CLAUDE.md` testing guidance; if none exists, add a single Vitest setup under `src/server/__tests__/`) that simulates two recruiter sessions and asserts isolation across the full surface:

For recruiters A and B:

1. A creates candidate `alice@example.com`; B creates candidate `alice@example.com`. Both succeed; rows are distinct; the global-email oracle is gone.
2. `candidates.list` as A returns A's Alice only; same for B.
3. `candidates.byId` as A on B's Alice returns `NOT_FOUND`.
4. `candidates.update` / `candidates.delete` as A on B's Alice returns `NOT_FOUND` and does not mutate.
5. A creates a role + question + invite for A's Alice. `invites.list` / `byId` as B does not see it; `invites.delete` as B returns `NOT_FOUND`.
6. `invites.create` as A with a B-owned `roleId` or `questionId` is rejected with `FORBIDDEN`.
7. Candidate-facing `invites.byCode` still resolves correctly for the original invite code.

#### Acceptance criteria

- [ ] Test file exists at `src/server/__tests__/candidate-isolation.test.ts`.
- [ ] All seven assertions above pass.
- [ ] Test command (whatever is introduced) is documented in `CLAUDE.md` under Testing Guidelines.

#### User stories addressed

- All of the above, as automated regression coverage.
