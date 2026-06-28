# Postgres + Drizzle Migration - Implementation Issues

> Derived from `2026-03-21-postgres-drizzle-migration-plan.md`
> Each issue is a thin vertical slice. Dependencies are noted per issue.

---

## Issue 1: Drizzle Infrastructure Setup

**Type:** AFK | **Priority:** P0 (prerequisite for all)
**Depends on:** Nothing

### Scope

Set up Drizzle ORM + Neon connection. No schema, no pages, no data.

### Tasks

- Install `drizzle-orm`, `@neondatabase/serverless` as dependencies
- Install `drizzle-kit`, `dotenv`, `tsx` as dev dependencies
- Create `drizzle.config.ts` at project root (PostgreSQL dialect, schema path, `DATABASE_URL` env var)
- Create `src/server/db/index.ts` — DB client singleton using Neon serverless driver
- Add npm scripts to `package.json`: `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`
- Add `DATABASE_URL` to `.env.local` (and document in README)

### Acceptance

- `npm run build` passes (no runtime changes)
- `drizzle.config.ts` resolves correctly
- DB client module imports without error

---

## Issue 2: Database Schema, Migration & Seed

**Type:** AFK | **Priority:** P0 (prerequisite for all entity slices)
**Depends on:** Issue 1

### Scope

Define all Drizzle schema files, generate the initial migration, apply it, and seed from existing mock data. No page changes.

### Tasks

- Create `src/server/db/schema/enums.ts` — all pgEnum definitions (`user_role`, `role_status`, `question_role`, `question_difficulty`, `question_status`, `candidate_status`, `submission_status`, `time_unit`)
- Create table schema files:
  - `src/server/db/schema/users.ts`
  - `src/server/db/schema/job-roles.ts`
  - `src/server/db/schema/questions.ts`
  - `src/server/db/schema/role-question-assignments.ts`
  - `src/server/db/schema/candidates.ts`
  - `src/server/db/schema/candidate-question-assignments.ts`
  - `src/server/db/schema/submissions.ts`
- Create `src/server/db/schema/relations.ts` — Drizzle relations for relational queries
- Create `src/server/db/schema/index.ts` — barrel export
- Create `src/server/db/seed.ts`:
  - Import mock data from `src/data/recruiters.ts`, `src/data/candidates.ts`, `src/data/questions.ts`
  - Map string IDs to deterministic UUIDs via UUID v5
  - Insert in dependency order: users -> job_roles -> questions -> assignments -> candidates -> submissions
  - Use `ON CONFLICT DO NOTHING` for idempotency
- Run `db:generate` + `db:migrate` (or `db:push`) to create tables
- Run `db:seed` to populate

### Acceptance

- `npm run db:generate` produces a migration file
- `npm run db:push` creates all tables in Neon
- `npm run db:seed` populates data without errors
- `npm run db:studio` shows all tables with correct data and relationships
- `npm run build` still passes

---

## Issue 3: Simplify Question Type & UI

**Type:** AFK | **Priority:** P1
**Depends on:** Nothing (can be done in parallel with Issues 1-2)

### Scope

Remove deprecated fields from the `Question` type and clean up UI that renders them. This is prep work that makes entity migration slices cleaner.

### Tasks

- **`src/types/question-shared.ts`:**
  - Remove `objective`, `requirements`, `acceptance` fields from `Question` type
  - Remove `EvaluationMetric` type (if fully unused after this)
  - Remove `testConfig` from `Question` type (keep as UI-only disabled concept)
  - Remove `TestConfig` type from the data model
- **Question form** (`src/hooks/recruiter-question-editor/useRecruiterQuestionForm.ts`):
  - Remove `objective`, `requirements`, `acceptance` from form fields/state
  - Keep `testConfig` fields in form but disabled with "Coming soon" indicator
- **Question detail pages:** Remove rendering of `objective`, `requirements`, `acceptance`, `evaluationMetrics`
- Delete `defaultEvaluationMetrics` constant from `src/data/recruiters.ts`
- Fix any TypeScript errors caused by removed fields

### Acceptance

- `npm run build` passes
- Question form renders without removed fields
- Question detail pages render without removed fields
- `testConfig` fields visible but disabled in the form

---

## Issue 4: Remove CandidateAssessment & Simplify Submission/Candidate Types

**Type:** AFK | **Priority:** P1
**Depends on:** Nothing (can be done in parallel with Issues 1-3)

### Scope

Eliminate `CandidateAssessment` as a concept, simplify Submission and Candidate types, remove CV fields. Prep work for entity slices.

### Tasks

- **`src/types/candidate.ts`:**
  - Delete `CandidateAssessment` type
  - Delete `AssessmentStatus` type
- **`src/types/recruiter.ts`:**
  - Remove `weightedScore`, `evaluationBreakdown` from `Submission`
  - Add to `Submission`: `chatMessages`, `snapshots`, `initialFiles`, `finalFiles`, `analysisResult`, `timeSpent`, `timeExceeded`, `tokensIn`, `tokensOut`, `messageCount`, `startedAt`
  - Remove `candidateName`, `candidateEmail` from `Submission`
  - Remove `cvData`, `cvFileName` from `Candidate`
- **UI cleanup:**
  - Remove CV upload UI from candidate invite/edit forms
  - Remove CV display/download from candidate detail pages
  - Remove `evaluationBreakdown` / `weightedScore` rendering from submission detail page
- Fix all TypeScript errors from type changes

### Acceptance

- `npm run build` passes
- No references to `CandidateAssessment` remain in app code
- No CV upload/display UI on candidate pages
- Submission detail page compiles (even if rendering is temporarily placeholder)

---

## Issue 5: Questions — Service -> API -> Hooks -> Pages

**Type:** AFK | **Priority:** P2
**Depends on:** Issues 2, 3

### Scope

Full vertical slice for Questions: server service, API routes, React Query hooks, and page migration.

### Layers

**Service** — `src/server/services/questions.ts`:
- `listQuestions(filters?)` -> `Question[]`
- `getQuestionById(id)` -> `Question | null`
- `getQuestionsByIds(ids)` -> `Question[]`
- `createQuestion(data)` -> `Question`
- `updateQuestion(id, updates)` -> `Question`
- `deleteQuestion(id)` -> void
- `duplicateQuestion(id)` -> `Question`

**Validation** — `src/server/validation/questions.ts`:
- Zod schemas for create/update payloads

**API Routes:**
- `GET/POST /api/questions`
- `GET/PATCH/DELETE /api/questions/[questionId]`
- `POST /api/questions/[questionId]/duplicate`

**Client API** — `src/lib/api/questions.ts`:
- `fetchQuestions`, `fetchQuestion`, `createQuestion`, `updateQuestion`, `deleteQuestion`, `duplicateQuestion`

**React Query Hooks** — `src/hooks/api/questions.ts`:
- `useQuestionsQuery`, `useQuestionQuery`
- `useCreateQuestionMutation`, `useUpdateQuestionMutation`, `useDeleteQuestionMutation`, `useDuplicateQuestionMutation`

**Page Migration:**
- `src/app/recruiters/questions/page.tsx` — drop store reads, use `useQuestionsQuery()`
- `src/app/recruiters/questions/[questionId]/page.tsx` — use `useQuestionQuery(id)`, replace store mutations with React Query mutations

### Acceptance

- Questions list page loads data from Postgres (visible in Network tab)
- Create, edit, delete, duplicate question operations persist to DB
- Loading/error states render correctly
- `npm run build` passes

---

## Issue 6: Job Roles — Service -> API -> Hooks -> Pages

**Type:** AFK | **Priority:** P2
**Depends on:** Issues 2, 5 (roles reference questions via assignments)

### Scope

Full vertical slice for Job Roles: computed counts (candidateCount, submissionCount, pendingReviews), question assignments, and recruiter dashboard migration.

### Layers

**Service** — `src/server/services/roles.ts`:
- `listRoles(filters?)` -> `JobRole[]` — computes candidateCount, submissionCount, pendingReviews via subqueries
- `getRoleById(id)` -> `JobRole | null`
- `createRole(data)` -> `JobRole` — inserts role + role_question_assignments in transaction
- `updateRole(id, updates)` -> `JobRole`
- `deleteRole(id)` -> void
- `updateRoleStatus(id, status)` -> `JobRole`
- `setRoleQuestions(roleId, questionIds)` -> void — delete + insert assignments in transaction

**Validation** — `src/server/validation/roles.ts`

**API Routes:**
- `GET/POST /api/roles`
- `GET/PATCH/DELETE /api/roles/[roleId]`
- `PATCH /api/roles/[roleId]/status`
- `PUT /api/roles/[roleId]/questions`

**Client API** — `src/lib/api/roles.ts`

**React Query Hooks** — `src/hooks/api/roles.ts`:
- `useRolesQuery`, `useRoleQuery`
- `useCreateRoleMutation`, `useUpdateRoleMutation`, `useDeleteRoleMutation`, `useUpdateRoleStatusMutation`, `useSetRoleQuestionsMutation`

**Page Migration:**
- `src/app/recruiters/page.tsx` — drop `useInitializeRecruiterData`, use `useRolesQuery()`. Replace store mutations with mutation hooks.
- `src/app/recruiters/roles/new/page.tsx` — use `useQuestionsQuery()` for question picker, `useCreateRoleMutation()`
- `src/app/recruiters/roles/[roleId]/page.tsx` — use `useRoleQuery()` + related queries

### Acceptance

- Recruiter dashboard loads roles from Postgres with correct computed counts
- Create role with question assignments works end-to-end
- Role status updates persist
- `npm run build` passes

---

## Issue 7: Candidates — Service -> API -> Hooks -> Pages

**Type:** AFK | **Priority:** P2
**Depends on:** Issues 2, 4, 6 (candidates belong to roles)

### Scope

Full vertical slice for Candidates: CRUD, invite codes, question assignments, and recruiter-side candidate management pages.

### Layers

**Service** — `src/server/services/candidates.ts`:
- `listCandidates(filters?)` -> `Candidate[]` — reconstructs `assignedQuestionIds` from join table
- `getCandidateById(id)` -> `Candidate | null`
- `getCandidateByInviteCode(code)` -> `Candidate | null`
- `createCandidate(data)` -> `Candidate` — inserts candidate + candidate_question_assignments
- `updateCandidate(id, updates)` -> `Candidate`
- `updateCandidateStatus(id, status)` -> `Candidate` — auto-sets timestamp fields
- `deleteCandidate(id)` -> void

**Validation** — `src/server/validation/candidates.ts`

**API Routes:**
- `GET/POST /api/candidates`
- `GET/PATCH/DELETE /api/candidates/[candidateId]`
- `PATCH /api/candidates/[candidateId]/status`
- `GET /api/candidates/invite/[inviteCode]`

**Client API** — `src/lib/api/candidates.ts`

**React Query Hooks** — `src/hooks/api/candidates.ts`:
- `useCandidatesQuery`, `useCandidateQuery`, `useCandidateByInviteCodeQuery`
- `useCreateCandidateMutation`, `useUpdateCandidateMutation`, `useUpdateCandidateStatusMutation`, `useDeleteCandidateMutation`

**Page Migration:**
- `src/app/recruiters/candidates/[candidateId]/page.tsx` — use `useCandidateQuery()` + joins for role/questions
- Candidate list within role detail pages
- `src/hooks/send-to-candidate/useSendToCandidate.ts` — replace store mutations with API mutations

### Acceptance

- Candidate management pages load from Postgres
- Create candidate with question assignments and invite code works
- Candidate status transitions update timestamps automatically
- No CV upload UI present
- `npm run build` passes

---

## Issue 8: Submissions — Service -> API -> Hooks -> Pages

**Type:** AFK | **Priority:** P2
**Depends on:** Issues 2, 4, 7 (submissions reference candidates, roles, questions)

### Scope

Full vertical slice for Submissions: CRUD, status transitions, and recruiter-side submission pages.

### Layers

**Service** — `src/server/services/submissions.ts`:
- `listSubmissions(filters?)` -> `Submission[]` — joins candidate + question + role for display data
- `getSubmissionById(id)` -> `Submission | null`
- `createSubmission(data)` -> `Submission` — status `not_started`, empty chat/analysis
- `updateSubmission(id, updates)` -> `Submission`
- `updateSubmissionStatus(id, status)` -> `Submission` — auto-sets timestamps
- `submitWithSession(id, sessionData)` -> `Submission` — saves chat_messages, snapshots, files, time/token stats
- `saveAnalysis(id, analysisResult)` -> `Submission` — stores AI analysis result

**Validation** — `src/server/validation/submissions.ts`

**API Routes:**
- `GET/POST /api/submissions`
- `GET/PATCH /api/submissions/[submissionId]`
- `PATCH /api/submissions/[submissionId]/status`
- `PUT /api/submissions/[submissionId]/session`
- `PUT /api/submissions/[submissionId]/analysis`

**Client API** — `src/lib/api/submissions.ts`

**React Query Hooks** — `src/hooks/api/submissions.ts`:
- `useSubmissionsQuery`, `useSubmissionQuery`
- `useCreateSubmissionMutation`, `useUpdateSubmissionMutation`, `useUpdateSubmissionStatusMutation`, `useSubmitSessionMutation`, `useSaveAnalysisMutation`

**Page Migration:**
- `src/app/recruiters/submissions/[submissionId]/page.tsx` — use `useSubmissionQuery()`
- `src/app/recruiters/roles/[roleId]/page.tsx` — use `useSubmissionsQuery({ roleId })` for submission list within role

### Acceptance

- Submission list/detail pages load from Postgres
- Submission status transitions work with auto-timestamps
- `npm run build` passes

---

## Issue 9: Migrate question-resolver.ts to Read from DB

**Type:** AFK | **Priority:** P2
**Depends on:** Issues 5, 7

### Scope

Replace static data imports in `src/server/question-resolver.ts` with service module calls. This is the server-side path that resolves questions and invite codes for the candidate-facing experience.

### Tasks

- `resolveQuestion(id)` calls `getQuestionById(id)` from questions service (replaces static import)
- `resolveInviteCode(code)` calls `getCandidateByInviteCode(code)` from candidates service (replaces mock data lookup)
- Remove hardcoded `questionId = "001"` override
- Remove `import { ... } from '@/data/recruiters'` and `'@/data/questions'` from this file
- Update `GET /api/questions/[id]` route to use the updated resolver
- Update `GET /api/invite/[code]` route to use the updated resolver

### Acceptance

- `/api/questions/[id]` returns question data from Postgres (not hardcoded "001")
- `/api/invite/[code]` resolves candidate from Postgres
- No static data imports remain in `question-resolver.ts`
- Candidate assessment flow via invite code works end-to-end

---

## Issue 10: Candidate Dashboard — Read Submissions Instead of Assessments

**Type:** AFK | **Priority:** P2
**Depends on:** Issues 4, 8

### Scope

Replace the candidate-facing dashboard to read from `submissions` instead of the now-deleted `CandidateAssessment` concept.

### Tasks

- `src/app/candidates/page.tsx`:
  - Remove `useInitializeCandidateStore` hook
  - Use `useSubmissionsQuery({ candidateId })` to fetch the candidate's submissions
  - Render submission data directly: question title, role title, company name via joins
  - Score from `submission.analysisResult?.overallScore`
  - Status from `submission.status`
  - Replace `hasHydrated` loading gate with `isLoading` from query hook
- `src/app/questions/page.tsx` — use `useQuestionsQuery({ status: 'published' })` for candidate question catalog
- `src/app/questions/[id]/page.tsx` — use `useQuestionQuery(id)`, keep sandbox/timer/chat stores unchanged

### Acceptance

- Candidate dashboard loads assessment list from submissions table
- Each assessment shows question title, role, company, status, and score (if available)
- No references to `CandidateAssessment` or `candidateStore` in candidate pages
- `npm run build` passes

---

## Issue 11: Persist Session Data on Assessment Submit

**Type:** AFK | **Priority:** P2
**Depends on:** Issues 8, 9

### Scope

When a candidate submits an assessment, persist their full session data (chat messages, code snapshots, files, usage stats) to the submission record in Postgres.

### Tasks

- On assessment completion in `src/app/questions/[id]/page.tsx` (or the relevant submit handler):
  - Gather session data from Zustand stores: `questionSessionStore` (chat messages, tokens, snapshots), `sandboxStore` (files), `timerStore` (time spent)
  - Call `useSubmitSessionMutation()` with:
    - `chatMessages`: full chat history
    - `snapshots`: timeline snapshots
    - `initialFiles` / `finalFiles`: code state
    - `timeSpent`, `timeExceeded`: duration tracking
    - `tokensIn`, `tokensOut`, `messageCount`: usage stats
  - Set submission status to `submitted`
- Same flow for `src/app/assess/[inviteCode]/page.tsx`:
  - Use `useCandidateByInviteCodeQuery(inviteCode)` to resolve
  - On submit, persist session to linked submission
  - Replace the 4-store hydration + manual lookups pattern

### Acceptance

- Completing an assessment via `/questions/[id]` persists session data to DB
- Completing an assessment via `/assess/[inviteCode]` persists session data to DB
- `db:studio` shows chat_messages, snapshots, files populated on submission
- Submission status changes to `submitted` with correct timestamp

---

## Issue 12: Persist Analysis Results on Submission

**Type:** AFK | **Priority:** P2
**Depends on:** Issue 8

### Scope

After the AI analysis route generates results, persist them on the submission record.

### Tasks

- Update `POST /api/analysis` request payload to accept `submissionId`
- After analysis completes, call `saveAnalysis(submissionId, result)` to write `analysis_result` jsonb on the submission
- `analysis_result` stores `{ overallScore, messageInsights[] }` (same shape as current analysis output)
- Update the client-side analysis flow to pass `submissionId` when calling `/api/analysis`

### Acceptance

- Running analysis on a submission stores the result in `submissions.analysis_result`
- `db:studio` shows `analysis_result` populated with `overallScore` and `messageInsights`
- Re-fetching the submission via API returns the stored analysis
- Candidate dashboard can show score from `submission.analysisResult.overallScore`

---

## Issue 13: Submission Detail — Chat Timeline & Analysis View

**Type:** AFK | **Priority:** P2
**Depends on:** Issues 8, 11, 12

### Scope

Build the new submission detail rendering: chat history timeline and structured analysis display, replacing the removed `evaluationBreakdown` / `weightedScore` view.

### Tasks

- `src/app/recruiters/submissions/[submissionId]/page.tsx`:
  - Render chat messages timeline from `submission.chatMessages` (role-colored message bubbles, timestamps)
  - Render timeline snapshots from `submission.snapshots`
  - Display code diff or file state from `initialFiles` / `finalFiles`
  - Display analysis result: `overallScore` as primary metric, `messageInsights[]` as detailed breakdown
  - Show usage stats: `timeSpent`, `tokensIn`, `tokensOut`, `messageCount`, `timeExceeded`

### Acceptance

- Submission detail page displays chat conversation history
- Analysis score and insights are rendered
- Usage stats (time, tokens, messages) are visible
- Page handles submissions without analysis gracefully (pending analysis state)
- No references to `evaluationBreakdown` or `weightedScore` in submission UI

---

## Issue 14: Final Cleanup — Remove Mock Data & Dead Code

**Type:** AFK | **Priority:** P3
**Depends on:** All previous issues

### Scope

Remove all mock data artifacts, dead Zustand stores, initialization hooks, and stale localStorage keys.

### Tasks

**Delete domain Zustand stores:**
- `src/stores/recruiterRolesStore.ts`
- `src/stores/recruiterCandidatesStore.ts`
- `src/stores/recruiterSubmissionsStore.ts`
- `src/stores/recruiterQuestionsStore.ts` (alias)
- `src/stores/candidateStore.ts`
- `src/stores/candidateQuestionsStore.ts` (alias)
- `src/stores/questionsStore.ts`

**Delete initialization hooks:**
- `src/hooks/recruiter/useInitializeRecruiterData.ts`
- `src/hooks/candidates-page/useInitializeCandidateStore.ts`
- Any other `useInitialize*` hooks that load mock data

**Delete / clean mock data files:**
- `src/data/recruiters.ts` — delete domain data + helpers; move `availableLLMModels`, `availableTestFrameworks` to `src/lib/constants.ts`
- `src/data/candidates.ts` — DELETE
- `src/data/questions.ts` — DELETE
- `src/data/mock-analysis.ts` — DELETE
- `src/lib/mockAnalysisData.ts` — DELETE

**Simplify userStore:**
- Keep `userStore` (needed until better-auth). Remove localStorage persistence if mock user comes from server.

**Stale localStorage cleanup:**
- Add one-time cleanup in root layout removing stale keys: `cruxai-questions`, `cruxai-recruiter-roles`, `cruxai-recruiter-candidates`, `cruxai-recruiter-submissions`, `cruxai-candidate`

**Fix remaining imports:**
- Update any imports going through `src/data/*.ts` for types to import from `src/types/` directly
- `grep -r "src/data/recruiters" src/` should return zero runtime hits (seed script only)

### Acceptance

- `npm run build` passes
- `npm run lint` passes
- `grep -r "src/data/recruiters" src/` returns zero runtime hits (seed script is OK)
- `grep -r "CandidateAssessment" src/` returns zero hits
- All pages load from Postgres (Network tab shows API calls, no localStorage reads for domain data)
- localStorage no longer stores domain entities
- No console errors or hydration warnings
- README.md updated with env setup + DB commands

---

## Dependency Graph

```
Issue 1: Drizzle Setup
  └─> Issue 2: Schema + Migration + Seed
        ├─> Issue 5: Questions (also needs Issue 3)
        │     └─> Issue 9: question-resolver.ts (also needs Issue 7)
        │           └─> Issue 11: Session Persistence (also needs Issue 8)
        ├─> Issue 6: Job Roles (also needs Issue 5)
        │     └─> Issue 7: Candidates (also needs Issue 4)
        │           └─> Issue 8: Submissions (also needs Issue 4)
        │                 ├─> Issue 10: Candidate Dashboard (also needs Issue 4)
        │                 ├─> Issue 12: Analysis Persistence
        │                 └─> Issue 13: Submission Detail (also needs Issues 11, 12)
        └─────────────────────> Issue 14: Final Cleanup (all previous)

Issues 3 & 4 (type simplification) have NO dependencies — start immediately.
```

## Suggested Parallelism

| Phase | Issues | Notes |
|-------|--------|-------|
| **Now** | 1, 3, 4 | Infrastructure + type prep in parallel |
| **After 1** | 2 | Schema needs Drizzle setup |
| **After 2+3** | 5 | Questions vertical |
| **After 5** | 6 | Roles vertical |
| **After 4+6** | 7 | Candidates vertical |
| **After 4+7** | 8 | Submissions vertical |
| **After 5+7** | 9 | question-resolver |
| **After 4+8** | 10 | Candidate dashboard |
| **After 8+9** | 11 | Session persistence |
| **After 8** | 12 | Analysis persistence |
| **After 11+12** | 13 | Submission detail view |
| **Last** | 14 | Final cleanup |
