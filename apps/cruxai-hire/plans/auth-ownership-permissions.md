# Plan: Auth, Ownership & Permissions Redesign

> Generated from: docs/2026-03-25-auth-ownership-design.md
> Date: 2026-03-25

## Overview

Consolidate the two disconnected user tables into a single better-auth-managed `user` table extended with a `role` field. Add ownership to `jobRoles` and `questions`, introduce question visibility (`isPublic`), enforce permission rules on all API routes, and remove the now-redundant app-level `users` table.

---

## Tasks

### Task 1: Extend better-auth user with `role` field

- **Type**: AFK
- **Blocked by**: None — can start immediately

#### What to build

Add a `role` column (`'recruiter' | 'candidate'`) to the better-auth `user` table. This is the foundation for all subsequent tasks.

- Add a Drizzle migration via `drizzle.auth.config.ts` to add `role text not null default 'recruiter'` to the `user` table
- Declare the field in `src/lib/auth.ts` via `user.additionalFields`
- Expose `role` on the client in `src/lib/auth-client.ts`
- Keep `userRoleEnum` in `src/server/db/schema/enums.ts` — it will still be used for the better-auth column type

#### Acceptance criteria

- [ ] `user` table has a `role` column in the database after migration
- [ ] `auth.ts` declares `role` as an additional field with `defaultValue: 'recruiter'`
- [ ] `auth-client.ts` exposes `role` on the session user object
- [ ] Signing up creates a user with `role = 'recruiter'` by default
- [ ] `session.user.role` is accessible in server-side route handlers

---

### Task 2: Job role ownership — schema + API

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Replace `jobRoles.recruiterName` (freeform string) with `jobRoles.ownerId` (FK to `user.id`). Update all `/api/roles` routes to enforce single-owner access.

- Drizzle migration: drop `recruiter_name`, add `owner_id text not null references "user"(id) on delete cascade`
- Update `src/server/db/schema/job-roles.ts`
- Update `src/server/db/schema/relations.ts` to add `user → jobRoles` relation
- `GET /api/roles` — return only roles where `ownerId = session.user.id`
- `POST /api/roles` — set `ownerId = session.user.id` automatically, remove `recruiterName` from input
- `GET /api/roles/[roleId]` — return 403 if `ownerId !== session.user.id`
- `PUT /api/roles/[roleId]` — return 403 if `ownerId !== session.user.id`
- `DELETE /api/roles/[roleId]` — return 403 if `ownerId !== session.user.id`

#### Acceptance criteria

- [ ] `job_roles` table has `owner_id` column and no `recruiter_name` column after migration
- [ ] Creating a role sets `ownerId` to the current user — no manual input required
- [ ] Listing roles returns only roles owned by the current user
- [ ] Attempting to edit/delete another user's role returns 403
- [ ] Existing validation schemas updated to remove `recruiterName`

---

### Task 3: Question ownership + visibility — schema + API

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Add `ownerId` and `isPublic` to `questions`. Update all `/api/questions` routes to reflect ownership and visibility rules.

- Drizzle migration: add `owner_id text not null references "user"(id) on delete cascade` and `is_public boolean not null default false`
- Update `src/server/db/schema/questions.ts`
- Update `src/server/db/schema/relations.ts` to add `user → questions` relation
- `GET /api/questions` — return questions where `ownerId = session.user.id` OR `isPublic = true`
- `POST /api/questions` — set `ownerId = session.user.id`, accept `isPublic` from input
- `GET /api/questions/[questionId]` — return 403 if question is private and `ownerId !== session.user.id`
- `PUT /api/questions/[questionId]` — return 403 if `ownerId !== session.user.id`; strip `isPublic` from update payload (immutable)
- `DELETE /api/questions/[questionId]` — return 403 if `ownerId !== session.user.id`

#### Acceptance criteria

- [ ] `questions` table has `owner_id` and `is_public` columns after migration
- [ ] Creating a question sets `ownerId` automatically and accepts `isPublic`
- [ ] Listing questions returns own questions plus all public questions
- [ ] Private questions owned by another user return 403 on direct fetch
- [ ] `isPublic` cannot be changed via the update endpoint
- [ ] Existing validation schemas updated to include `isPublic` on create, exclude it on update

---

### Task 4: Role-question assignment permission enforcement

- **Type**: AFK
- **Blocked by**: Tasks 2 + 3

#### What to build

Update `POST /api/roles/[roleId]/questions` to enforce the permission matrix from the design doc. No schema changes — enforcement logic only.

- Before inserting into `roleQuestionAssignments`:
  1. Verify the role exists and `role.ownerId = session.user.id` (403 otherwise)
  2. Fetch the question and check `isPublic`
  3. If `isPublic = true`: allow (role ownership already verified)
  4. If `isPublic = false`: additionally verify `question.ownerId = session.user.id` (403 otherwise)
- Apply the same ownership check to `DELETE /api/roles/[roleId]/questions` (removing an assignment requires role ownership)

#### Acceptance criteria

- [ ] Any recruiter can assign a public question to their own role
- [ ] Assigning a public question to another user's role returns 403
- [ ] A recruiter can assign their own private question to their own role
- [ ] Assigning another user's private question to any role returns 403
- [ ] Removing an assignment from a role you don't own returns 403

---

### Task 5: Drop app `users` table

- **Type**: AFK
- **Blocked by**: Tasks 2 + 3

#### What to build

Remove the disconnected app-level `users` table now that ownership is handled via `user.id` (better-auth). This is a cleanup task with no new behavior.

- Verify no remaining FK references to `users.id` in other schema files
- Remove `src/server/db/schema/users.ts`
- Remove `export * from './users'` from `src/server/db/schema/index.ts`
- Drizzle migration: `DROP TABLE users`
- Search codebase for any remaining imports of `users` from the schema and remove/replace them

#### Acceptance criteria

- [ ] `users` table no longer exists in the database after migration
- [ ] `src/server/db/schema/users.ts` is deleted
- [ ] No TypeScript errors from removed imports
- [ ] `npm run build` passes cleanly

---

### Task 6: Recruiter route gating via session role

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Enforce that all recruiter-facing API routes reject requests from unauthenticated users or users with `role !== 'recruiter'`. Centralise the auth check to avoid repetition.

- Create a server utility (e.g. `src/server/auth-guard.ts`) that wraps `auth.api.getSession()` and returns the session user or throws a structured 401/403 response
- Add a `requireRecruiter()` helper that additionally checks `user.role === 'recruiter'`
- Apply `requireRecruiter()` to all routes under `/api/roles`, `/api/questions`, `/api/invites`, `/api/candidates`
- Return `401` for unauthenticated, `403` for wrong role

#### Acceptance criteria

- [ ] Unauthenticated requests to recruiter routes return 401
- [ ] Requests from a `candidate`-role user to recruiter routes return 403
- [ ] Auth guard utility is reused across all protected routes (no duplication)
- [ ] Login page redirects back to intended route after authentication
