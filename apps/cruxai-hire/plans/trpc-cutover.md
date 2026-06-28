# Plan: tRPC Cutover Across the Entire App

> Generated from: `docs/2026-05-09-trpc-introduction-and-value.md`, `docs/2026-03-16-2239-trpc-cutover-design.md`, official setup guide at https://trpc.io/docs/client/tanstack-react-query/setup
> Date: 2026-05-09

## Overview

Replace every non-streaming REST endpoint in the cruxai app with typed tRPC procedures, using the modern `@trpc/tanstack-react-query` `createTRPCContext` API. The streaming chat route (`/api/chat`) and the better-auth route (`/api/auth/[...all]`) are explicitly out of scope and remain as-is. Each domain (questions, roles, candidates, invites, submissions, analysis, sandbox) ships as a vertical slice that swaps procedures + hooks + deletes legacy routes/fetchers, preserving the existing custom-hook boundary so components don't change. Foundation work (init, context, fetch route, auth middlewares, provider wiring) lands first as a HITL slice for architectural review; every subsequent domain is AFK.

---

## Tasks

### Task 1: Foundation — tRPC infra, context, fetch route, auth middlewares

- **Type**: HITL
- **Blocked by**: None — can start immediately

#### What to build

End-to-end tRPC plumbing capable of executing one stub procedure round-trip through `/api/trpc`, with auth middlewares ready for every later domain to consume. Use the **modern** `@trpc/tanstack-react-query` API (`createTRPCContext<AppRouter>()`), not the legacy `createTRPCReact()` pattern that appears in the March design doc.

Specifically:

- **Install dependencies**: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `superjson`. (`@tanstack/react-query` already present.)
- **Server tRPC primitives** under `src/server/trpc/`:
  - `init.ts`: initialize tRPC with `superjson` transformer, define base `router`, `publicProcedure`, and middlewares for `recruiterProcedure` and `candidateProcedure` that wrap the existing `requireRecruiter()` / candidate auth checks (currently in `src/server/auth-guard.ts`) and inject the typed user into `ctx`.
  - `context.ts`: `createTRPCContext({ req })` returning `{ headers, requestId, getSession }`. Auth resolution is lazy inside middlewares so public procedures don't pay for it.
  - `routers/_app.ts`: `appRouter` exporting `export type AppRouter = typeof appRouter;`. Initially exposes one stub `health.ping` procedure to prove the wiring.
- **Fetch handler**: `src/app/api/trpc/[trpc]/route.ts` exporting `GET` and `POST` via `fetchRequestHandler` from `@trpc/server/adapters/fetch`, passing `createTRPCContext` and an `onError` hook that logs to Sentry.
- **Client setup** under `src/lib/trpc/`:
  - `trpc.ts`: `export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();`
  - `query-client.ts`: SSR-safe `getQueryClient()` (server creates per-request; browser singleton) per the official setup guide.
- **Provider wiring**: extend `src/app/providers.tsx` to instantiate `trpcClient` via `createTRPCClient<AppRouter>({ links: [httpBatchLink({ url: '/api/trpc', transformer: superjson })] })` inside `useState(() => ...)`, wrap the existing `QueryClientProvider` with `TRPCProvider`. Reuse the existing `QueryClient` — do not create a second one.
- **Error mapping** documented in a single helper: `BAD_REQUEST` for Zod failures, `UNAUTHORIZED` for missing/invalid session, `FORBIDDEN` for ownership violations, `NOT_FOUND` for missing resources, `INTERNAL_SERVER_ERROR` for upstream failures (sandbox, AI gateway).

#### Acceptance criteria

- [x] `npm run build` and `npm run lint` pass with new files in place.
- [ ] Hitting `/api/trpc/health.ping` returns a typed superjson response. (needs runtime smoke test)
- [ ] A throwaway page or temporary `useEffect` calls `useQuery(trpc.health.ping.queryOptions())` and renders the result. (needs runtime smoke test)
- [ ] `recruiterProcedure` rejects unauthenticated calls with `UNAUTHORIZED` and rejects non-recruiter sessions with `FORBIDDEN`. (needs runtime smoke test)
- [ ] `candidateProcedure` rejects calls with no/invalid invite cookie or invite code. (candidateProcedure = publicProcedure for now; domain tasks validate invite codes in their input)
- [ ] `superjson` transformer round-trips `Date` values in both directions. (needs runtime smoke test — health.ping returns a Date)
- [x] `src/app/providers.tsx` mounts a single `QueryClient` and a single `trpcClient`.
- [x] No business logic added to the router layer in this slice.
- [ ] HITL review sign-off on context shape, middleware composition, error mapping, and the choice to use a single `httpBatchLink`.

Status: done

#### User stories addressed

- Cutover doc §3 Target Architecture
- Cutover doc §4 Context Design
- Cutover doc §5 Validation and Error Model
- Cutover doc §7 Transport Details
- Value doc §1 (modern tRPC concept), §5 ("what doesn't change")

---

### Task 2: Questions domain cutover

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Replace every `/api/questions*` route with `questionsRouter` procedures and swap the consuming hooks. Keep the public hook names identical so no component changes.

- **Router** `src/server/trpc/routers/questions.ts`:
  - `questions.list` (recruiter, query) — input: optional `{ status?, role? }`; calls existing `listQuestions({ ownerId })`.
  - `questions.byId` (recruiter, query) — input: `{ id: string }`; calls existing recruiter-side fetch service. Returns the recruiter envelope.
  - `questions.create` (recruiter, mutation) — input: `createQuestionSchema`; calls `createQuestion`.
  - `questions.update` (recruiter, mutation) — input: `{ id, data: updateQuestionSchema }`.
  - `questions.delete` (recruiter, mutation) — input: `{ id }`.
  - `questions.duplicate` (recruiter, mutation) — input: `{ id }`.
  - `questions.resolve` (public, query) — input: `{ id, inviteCode?: string|null }`; reuses `src/server/question-resolver.ts`. Returns `ResolvedQuestionResponse`. Stays public because candidate flow uses an invite code, not a session.
- **Hook updates**:
  - `src/hooks/api/questions.ts`: replace each fetcher call with `useQuery(trpc.questions.list.queryOptions(filters))` / `useMutation(trpc.questions.create.mutationOptions({ onSuccess }))` etc. Replace `questionsKeys` with `trpc.questions.list.queryKey()` / `queryFilter()` for invalidations.
  - `src/hooks/question-detail/useQuestionById.ts`: switch to `trpc.questions.resolve.queryOptions({ id, inviteCode })`. Public response shape preserved.
- **Deletes**:
  - `src/lib/api/questions.ts` (entire file).
  - `src/app/api/questions/route.ts`, `src/app/api/questions/[questionId]/route.ts`, `src/app/api/questions/[questionId]/duplicate/route.ts`.
- **Smoke**: list, view, create, edit, duplicate, delete a question as a recruiter; load a candidate question page via invite link.

#### Acceptance criteria

- [ ] No `fetch('/api/questions...')` remains in the codebase.
- [ ] Recruiter dashboard, question editor, and candidate question page all work end-to-end.
- [ ] Server-side ownership checks still reject non-owner recruiter access (`FORBIDDEN`).
- [ ] Invalidation after create/update/delete/duplicate refreshes the list view.
- [ ] React Query cache for `questions.byId` is invalidated by `questions.update`.
- [ ] Server error messages (e.g., uniqueness violations) reach the UI via `error.message` instead of "Failed to update question."
- [ ] All three legacy route files are deleted.

#### User stories addressed

- Value doc §2.1, §2.2, §2.5, §2.6 (the `data.question ?? data` problem)
- Value doc §3 (before/after example)
- Value doc §4.4 (recruiter CRUD cluster)

---

### Task 3: Roles domain cutover

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Replace every `/api/roles*` route with `rolesRouter` procedures.

- **Router** `src/server/trpc/routers/roles.ts`:
  - `roles.list` (recruiter, query)
  - `roles.byId` (recruiter, query) — input: `{ id }`
  - `roles.create` (recruiter, mutation)
  - `roles.update` (recruiter, mutation)
  - `roles.delete` (recruiter, mutation)
  - `roles.setStatus` (recruiter, mutation) — input: `{ id, status }` (covers `roles/[id]/status`)
  - `roles.questions` (recruiter, query) — input: `{ roleId }` (covers `roles/[id]/questions`)
- **Hook updates**: rewrite `src/hooks/api/roles.ts` and `src/hooks/role-form/useRoleForm.ts` (only the mutation-coordination part).
- **Deletes**: `src/lib/api/roles.ts`, `src/app/api/roles/route.ts`, `src/app/api/roles/[roleId]/route.ts`, `src/app/api/roles/[roleId]/status/route.ts`, `src/app/api/roles/[roleId]/questions/route.ts`.
- **Smoke**: create role, edit, change status, view its questions, delete.

#### Acceptance criteria

- [ ] All four `/api/roles*` routes deleted.
- [ ] Role list, role detail, and role-form flows work unchanged from the user's perspective.
- [ ] `roles.setStatus` invalidates both `roles.list` and `roles.byId`.
- [ ] `src/lib/api/roles.ts` deleted; no remaining imports of it.

#### User stories addressed

- Value doc §4.4 (recruiter CRUD cluster — roles)

---

### Task 4: Candidates domain cutover

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Replace `/api/candidates*` with `candidatesRouter`.

- **Router** `src/server/trpc/routers/candidates.ts`:
  - `candidates.list` (recruiter, query)
  - `candidates.byId` (recruiter, query)
  - `candidates.create` (recruiter, mutation)
  - `candidates.update` (recruiter, mutation)
  - `candidates.delete` (recruiter, mutation)
- **Hook updates**: `src/hooks/api/candidates.ts`.
- **Deletes**: `src/lib/api/candidates.ts`, `src/app/api/candidates/route.ts`, `src/app/api/candidates/[candidateId]/route.ts`.
- **Smoke**: create candidate, edit, delete from candidate management UI.

#### Acceptance criteria

- [ ] Candidate list and detail flows work unchanged.
- [ ] Both legacy route files deleted.
- [ ] Fetcher file deleted.
- [ ] Ownership checks still enforced via `recruiterProcedure`.

#### User stories addressed

- Value doc §4.4 (recruiter CRUD cluster — candidates)

---

### Task 5: Invites domain cutover

Status: done

- **Type**: AFK
- **Blocked by**: Task 1, Task 2

#### What to build

Replace every invite-related route with `invitesRouter`. Depends on Task 2 because invite resolution composes question resolution.

- **Router** `src/server/trpc/routers/invites.ts`:
  - `invites.list` (recruiter, query)
  - `invites.create` (recruiter, mutation) — covers `useSendToCandidate`
  - `invites.byCode` (public, query) — input: `{ code }`; covers `/api/invites/[code]` and `/api/invite/[code]` (collapse the two endpoints into one procedure; the legacy difference was URL shape, not behavior).
  - `invites.session` (public, query/mutation pair) — covers `/api/invites/[code]/session`. Determine query vs mutation by current verb usage; likely query for read, mutation for start/save.
  - `invites.start` (public, mutation) — drives `useInviteStart`.
- **Hook updates**:
  - `src/hooks/api/invites.ts`
  - `src/hooks/invite-page/useInviteResolution.ts`
  - `src/hooks/invite-landing/useInviteStart.ts`
  - `src/hooks/send-to-candidate/useSendToCandidate.ts`
  - `src/hooks/invite-candidate/useInviteCandidateForm.ts`
- **Deletes**: `src/lib/api/invites.ts`, `src/app/api/invites/route.ts`, `src/app/api/invites/[code]/route.ts`, `src/app/api/invites/[code]/session/route.ts`, `src/app/api/invite/[code]/route.ts`.
- **Smoke**: send a candidate an invite, follow the invite link, start the session, verify it lands on the question page wired through `questions.resolve` from Task 2.

#### Acceptance criteria

- [ ] Recruiter "send to candidate" flow creates an invite and shows it in the invites list.
- [ ] Candidate landing page resolves invite by code, starts session, navigates to question.
- [ ] Invalid/expired invite returns `FORBIDDEN` with a clear message at the UI layer.
- [ ] All five legacy route files deleted.
- [ ] `src/lib/api/invites.ts` deleted.

#### User stories addressed

- Value doc §4.4 (recruiter CRUD cluster — invites + invite landing)

---

### Task 6: Submissions domain cutover

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Replace every `/api/submissions*` route with `submissionsRouter`. This is the largest single domain — six routes.

- **Router** `src/server/trpc/routers/submissions.ts`:
  - `submissions.list` (recruiter, query)
  - `submissions.byId` (recruiter, query)
  - `submissions.status` (recruiter, query) — covers `/submissions/[id]/status`
  - `submissions.session` (recruiter, query) — covers `/submissions/[id]/session`
  - `submissions.saveSessionBackground` (candidate or recruiter — confirm during implementation, mutation) — covers `/submissions/[id]/session/background`
  - `submissions.analysis` (recruiter, query) — covers `/submissions/[id]/analysis`
- **Hook updates**: `src/hooks/api/submissions.ts` and any session-restore hooks (`useInviteSessionRestore`, `useQuestionAnalysisNotFoundRedirect`, `useTriggerQuestionAnalysis`) that touch these routes.
- **Deletes**: `src/lib/api/submissions.ts`, all six route files under `src/app/api/submissions/`.
- **Smoke**: complete a candidate session end-to-end, recruiter views the submission, runs analysis trigger, sees results.

#### Acceptance criteria

- [ ] Submission list, detail, status polling, session restore, and analysis view all work unchanged.
- [ ] Background save still functions during a candidate session (no UI freeze; payload size handled).
- [ ] All six legacy submission route files deleted.
- [ ] Fetcher file deleted.
- [ ] No regression in session-restore behavior.

#### User stories addressed

- Value doc §4.4 (recruiter CRUD cluster — submissions)
- Cutover doc §5 (error mapping for not-found analysis cases)

---

### Task 7: Analysis cutover

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Replace `/api/analysis` with `analysisRouter`.

- **Router** `src/server/trpc/routers/analysis.ts`:
  - `analysis.generate` (public/protected per current behavior, mutation) — input: existing analysis schema (apiKey, modelId, payload). Output: `AnalysisApiResponse`.
- Service extraction: move route-local logic into `src/server/analysis/generate-analysis.ts` if not already extracted.
- **Hook updates**: `src/hooks/useAnalysis.ts`.
- **Deletes**: `src/app/api/analysis/route.ts`. (No fetcher file for analysis — it lives inside the hook.)
- **Smoke**: trigger post-session analysis with a known API key + model; confirm scores, token usage, and error paths (missing key → `UNAUTHORIZED`, upstream failure → `INTERNAL_SERVER_ERROR`).

#### Acceptance criteria

- [ ] Analysis runs end-to-end with results rendered identically to before.
- [ ] Missing API key returns `UNAUTHORIZED` and the UI shows the actionable message.
- [ ] AI-gateway upstream failures surface as `INTERNAL_SERVER_ERROR` with the upstream message preserved server-side (logged) and a user-safe message in the UI.
- [ ] Legacy route deleted.

#### User stories addressed

- Value doc §4.3 (analysis hook)
- Cutover doc §6 analysis router

---

### Task 8: Sandbox domain cutover

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Replace every `/api/sandbox*` and `/api/create-sandbox` route with `sandboxRouter`. Highest blast radius slice — preserve Zustand store sync exactly.

- **Router** `src/server/trpc/routers/sandbox.ts`:
  - `sandbox.create` (mutation) — input: `{ repositoryUrl?: string }`; output: `{ sandboxId, url, files }`.
  - `sandbox.readFiles` (mutation, intentionally — see cutover doc §6 rationale) — input: `{ sandboxId }`.
  - `sandbox.writeFile` (mutation) — input: `{ sandboxId, filePath, content }`.
  - `sandbox.writeFiles` (mutation) — input: `{ sandboxId, files, deleteOthers? }`.
  - `sandbox.runTests` (mutation) — input: `{ sandboxId }`.
  - `sandbox.reconnect` (mutation) — input: `{ sandboxId }` (covers existing `/api/sandbox/reconnect`).
- Service extraction into `src/server/sandbox/*.ts` if route-local logic is still inline.
- **Hook updates**:
  - `src/hooks/useSandbox.ts` — every mutation rewrite must keep its existing `onSuccess` Zustand sync (`sandboxStore.updateFile`, etc.) intact.
  - `src/hooks/sandbox/useTestRunner.ts` — preserve `testResultsStore` sync.
- **Deletes**: all six sandbox-related route files; no fetcher files exist for sandbox today.
- **Batching note**: if `writeFiles` payloads strain the single batched HTTP link, split sandbox onto a non-batched link (per cutover doc §7).
- **Smoke**: create sandbox, edit file, save, refresh files, batch write, run tests, reconnect after disconnect.

#### Acceptance criteria

- [ ] No regression in sandbox file editor, test runner, or reconnect.
- [ ] Zustand `sandboxStore` and `testResultsStore` still receive updates from mutation `onSuccess` callbacks — no React Query cache duplication for file state.
- [ ] All six legacy sandbox route files deleted.
- [ ] Large batch writes complete without timing out (verify with a ≥20-file write).
- [ ] If batching pressure observed, sandbox link split to non-batched and documented.

#### User stories addressed

- Value doc §4.1 (sandbox writes)
- Cutover doc §6 sandbox router and §6 readFiles-as-mutation rationale

---

### Task 9: Final cleanup, audit, and docs

Status: done

- **Type**: AFK
- **Blocked by**: Tasks 2, 3, 4, 5, 6, 7, 8

#### What to build

Audit and finalize the cutover. After this slice, the only remaining custom API routes are `/api/chat` (streaming) and `/api/auth/[...all]` (better-auth).

- **Repo audit**:
  - Grep for `fetch('/api/` and `fetch("/api/` — assert only `/api/chat` and `/api/auth` matches remain.
  - Grep for `src/lib/api/` imports — assert none remain.
  - Delete `src/lib/api/` directory entirely if empty.
  - Confirm every `src/hooks/api/*.ts` uses `useTRPC()` and no raw `fetch`.
  - Confirm `questionsKeys`-style hand-maintained query-key constants are removed.
- **Docs**:
  - Update `CLAUDE.md` "State Management" / "Architecture Overview" sections to reflect: hooks call tRPC; tRPC dispatches to `src/server/trpc/routers/*` which delegate to `src/server/*` services; chat is the only streaming exception; better-auth is the only legacy custom route.
  - Update `src/app/api/README.md` to document that `/api/trpc/[trpc]`, `/api/chat`, and `/api/auth/[...all]` are the only routes by design.
  - Add a short "Adding a new tRPC procedure" section to `CLAUDE.md` showing the router → hook pattern using the `queryOptions`/`mutationOptions` API.
- **Type safety**:
  - Confirm `AppRouter` type is exported once from `src/server/trpc/routers/_app.ts` and imported only as `import type` on the client.
  - Run `npm run lint` and `npm run build` clean.
- **Optional follow-up flagged for later** (do not block this slice): adding Vitest router-level tests for input validation and error-code mapping per cutover doc §10.

#### Acceptance criteria

- [ ] `grep -r "fetch('/api/" src/` returns only chat/auth references.
- [ ] `src/lib/api/` directory is empty or deleted.
- [ ] `npm run lint` and `npm run build` pass.
- [ ] `CLAUDE.md` and `src/app/api/README.md` updated with the new boundary and a "how to add a procedure" snippet.
- [ ] Chat streaming via `useChat` against `/api/chat` confirmed working in a smoke pass.
- [ ] better-auth flows (sign-in, sign-out, session) confirmed unchanged.
- [ ] No `questionsKeys`-style manual query-key constants remain in any `src/hooks/api/*.ts`.

#### User stories addressed

- Value doc §3 (collapse three layers to one)
- Value doc §5 ("what doesn't change" — verifying chat + auth still untouched)
- Cutover doc §10 Migration Plan Phase 5 (legacy route deletion) and §13 follow-ups
