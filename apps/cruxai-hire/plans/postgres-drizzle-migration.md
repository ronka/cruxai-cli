# Plan: Postgres + Drizzle Migration

> Source PRD: `2026-03-21-postgres-drizzle-migration-plan.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **ORM**: `drizzle-orm` with `drizzle-kit` for migrations
- **DB host**: Neon (serverless Postgres, `@neondatabase/serverless` driver)
- **ID strategy**: UUID v4 (runtime), UUID v5 (seed for deterministic idempotency)
- **Auth**: Mock user for now; better-auth (OAuth/Google) in a separate future phase
- **API style**: REST route handlers in `src/app/api/`, thin wrappers over server service modules
- **Validation**: Zod schemas for API request bodies (`src/server/validation/`)
- **Client data fetching**: React Query (queries for reads, mutations for writes, cache invalidation on success)
- **Zustand scope (post-migration)**: UI-only state (modals, tabs, editor, sandbox, timer, test results, chat session, settings). No domain entity persistence.
- **Schema**:
  - `users` -- minimal, will be replaced/linked by better-auth later
  - `job_roles` -- with `created_by_user_id` FK to users; computed counts (no stored `candidateCount`/`submissionCount`/`pendingReviews`)
  - `questions` -- simplified: no `objective`, `requirements`, `acceptance`, `evaluationMetrics`, `testConfig` in DB
  - `role_question_assignments` -- M:N join (replaces `JobRole.questionIds[]`)
  - `candidates` -- with `invite_code` unique, `user_id` nullable (linked on better-auth login)
  - `candidate_question_assignments` -- M:N join (replaces `Candidate.assignedQuestionIds[]`)
  - `submissions` -- core record with `chat_messages`, `snapshots`, `initial_files`, `final_files`, `analysis_result` as jsonb; replaces both `Submission` and `CandidateAssessment`
- **Enums**: `user_role`, `role_status`, `question_role`, `question_difficulty`, `question_status`, `candidate_status`, `submission_status`, `time_unit`
- **Routes**:
  - `/api/roles`, `/api/roles/[roleId]`, `/api/roles/[roleId]/status`, `/api/roles/[roleId]/questions`
  - `/api/questions`, `/api/questions/[questionId]`, `/api/questions/[questionId]/duplicate`
  - `/api/candidates`, `/api/candidates/[candidateId]`, `/api/candidates/[candidateId]/status`, `/api/candidates/invite/[inviteCode]`
  - `/api/submissions`, `/api/submissions/[submissionId]`, `/api/submissions/[submissionId]/status`, `/api/submissions/[submissionId]/session`, `/api/submissions/[submissionId]/analysis`
- **Service modules**: `src/server/services/{roles,questions,candidates,submissions}.ts` -- encapsulate all DB access, return data shaped to match existing TS types
- **React Query hooks**: `src/hooks/api/` for queries + mutations; API client functions in `src/lib/api/`

---

## Phase 1: Type Simplification + UI Cleanup

**Goal**: Update TypeScript types to match the new simplified data model and remove all UI references to deleted fields. App still runs on mock data -- this is a pure type/UI cleanup.

### What to build

Update the shared TypeScript types to remove fields that won't exist in the database, then propagate those removals through all UI components, forms, and helpers that reference them. The app continues to run on mock data and Zustand stores throughout this phase.

### Acceptance criteria

- `Question` type in `src/types/question-shared.ts`: `objective`, `requirements`, `acceptance` fields removed
- `EvaluationMetric` type removed (or marked UI-only if still rendered somewhere)
- `TestConfig` removed from `Question` type (kept as UI-only disabled fields in question form)
- `CandidateAssessment` type deleted from `src/types/candidate.ts`
- `AssessmentStatus` type deleted (use `SubmissionStatus` from `recruiter.ts` instead)
- `Submission` type in `src/types/recruiter.ts`: `weightedScore` and `evaluationBreakdown` removed; `candidateName` and `candidateEmail` removed
- `Submission` type: new fields added -- `chatMessages`, `snapshots`, `initialFiles`, `finalFiles`, `analysisResult`, `timeSpent`, `timeExceeded`, `tokensIn`, `tokensOut`, `messageCount`, `startedAt`
- `Candidate` type: `cvData` and `cvFileName` removed
- Question form (`useRecruiterQuestionForm.ts`): `objective`, `requirements`, `acceptance` fields removed from form state
- Question form UI: `testConfig` fields present but disabled with "Coming soon" indicator
- Question detail pages: no rendering of `objective`, `requirements`, `acceptance`, `evaluationMetrics`
- Candidate forms/detail pages: CV upload UI removed (file input, preview, download link)
- Submission detail page: `evaluationBreakdown` / `weightedScore` rendering removed
- `defaultEvaluationMetrics` constant deleted from `src/data/recruiters.ts`
- Mock data files updated to conform to new types (remove deleted fields from mock objects)
- `npm run build` passes
- `npm run lint` passes
- All existing pages still load and function correctly on mock data

---

## Phase 2: DB Infrastructure + Schema + Seed

**Goal**: Install Drizzle, connect to Neon, define all schema files, run the initial migration, and seed from mock data. No page changes -- app still runs on mock data.

### What to build

Set up the full database infrastructure: dependencies, config, client singleton, all Drizzle schema files (enums, tables, relations), generate and apply the initial migration, and create a seed script that maps existing mock data to the new schema using deterministic UUIDs.

### Acceptance criteria

- `drizzle-orm` and `@neondatabase/serverless` installed as dependencies
- `drizzle-kit`, `dotenv`, `tsx` installed as dev dependencies
- `package.json` scripts added: `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`
- `drizzle.config.ts` created at project root
- `DATABASE_URL` env var documented (added to `.env.local`)
- DB client singleton at `src/server/db/index.ts`
- Schema files created under `src/server/db/schema/`: `index.ts`, `enums.ts`, `users.ts`, `job-roles.ts`, `questions.ts`, `role-question-assignments.ts`, `candidates.ts`, `candidate-question-assignments.ts`, `submissions.ts`, `relations.ts`
- `npm run db:generate` produces a SQL migration file
- `npm run db:migrate` applies the migration to Neon successfully
- Seed script at `src/server/db/seed.ts` maps mock data to DB using UUID v5 for deterministic IDs
- Seed inserts in dependency order: users -> job_roles -> questions -> role_question_assignments -> candidates -> candidate_question_assignments -> submissions
- Seed uses `ON CONFLICT DO NOTHING` for idempotency
- `npm run db:seed` populates all tables
- `npm run db:studio` shows all tables with correct data
- `npm run build` still passes (no pages touched)

---

## Phase 3: Questions End-to-End

**Goal**: Build the full vertical slice for Questions: service module, API routes, React Query hooks, and migrate all question-related pages to read/write from Postgres.

### What to build

Create the questions service module with all CRUD + duplicate operations. Wire up API route handlers with Zod validation. Create API client functions and React Query hooks. Then migrate the recruiter questions list page, question detail/edit page, create question page, and candidate question catalog to use React Query instead of Zustand + mock data.

### Acceptance criteria

- `src/server/services/questions.ts` created with: `listQuestions`, `getQuestionById`, `getQuestionsByIds`, `createQuestion`, `updateQuestion`, `deleteQuestion`, `duplicateQuestion`
- Zod validation schemas for question create/update payloads in `src/server/validation/`
- API routes: `GET/POST /api/questions`, `GET/PATCH/DELETE /api/questions/[questionId]`, `POST /api/questions/[questionId]/duplicate`
- API client functions in `src/lib/api/questions.ts`
- React Query hooks in `src/hooks/api/`: `useQuestionsQuery`, `useQuestionQuery`, `useCreateQuestionMutation`, `useUpdateQuestionMutation`, `useDeleteQuestionMutation`, `useDuplicateQuestionMutation`
- `src/app/recruiters/questions/page.tsx` migrated: uses `useQuestionsQuery()` instead of Zustand store
- `src/app/recruiters/questions/[questionId]/page.tsx` migrated: uses `useQuestionQuery()` + mutation hooks
- `src/app/questions/page.tsx` (candidate catalog) migrated: uses `useQuestionsQuery({ status: 'published' })`
- `src/app/questions/new/page.tsx` migrated: uses `useCreateQuestionMutation()`
- Questions mock data imports removed from migrated pages
- Loading and error states render correctly on all migrated pages
- CRUD operations verified (create, read, update, delete, duplicate) via Network tab
- `npm run build` passes

---

## Phase 4: Roles End-to-End

**Goal**: Build the full vertical slice for Roles: service module (with computed counts and role-question assignments), API routes, React Query hooks, and migrate all role-related pages.

### What to build

Create the roles service module with CRUD, status transitions, and role-question assignment management. Computed counts (`candidateCount`, `submissionCount`, `pendingReviews`) are calculated via SQL subqueries, not stored. Wire up API routes, client functions, and React Query hooks. Migrate the recruiter dashboard (roles list), create role page, and role detail page.

### Acceptance criteria

- `src/server/services/roles.ts` created with: `listRoles`, `getRoleById`, `createRole`, `updateRole`, `deleteRole`, `updateRoleStatus`, `setRoleQuestions`
- `listRoles` computes `candidateCount`, `submissionCount`, `pendingReviews`, `questionIds` via subqueries/joins
- `createRole` inserts role + role_question_assignments in a transaction
- `setRoleQuestions` does delete + insert assignments in a transaction
- Zod validation schemas for role create/update payloads
- API routes: `GET/POST /api/roles`, `GET/PATCH/DELETE /api/roles/[roleId]`, `PATCH /api/roles/[roleId]/status`, `PUT /api/roles/[roleId]/questions`
- API client functions in `src/lib/api/roles.ts`
- React Query hooks: `useRolesQuery`, `useRoleQuery`, `useCreateRoleMutation`, `useUpdateRoleMutation`, `useDeleteRoleMutation`, `useUpdateRoleStatusMutation`, `useSetRoleQuestionsMutation`
- `src/app/recruiters/page.tsx` migrated: uses `useRolesQuery()` instead of Zustand; store mutations replaced with mutation hooks
- `src/app/recruiters/roles/new/page.tsx` migrated: uses `useQuestionsQuery()` for question picker + `useCreateRoleMutation()`
- `src/app/recruiters/roles/[roleId]/page.tsx` migrated: uses `useRoleQuery()` + `useCandidatesQuery({ roleId })` + `useSubmissionsQuery({ roleId })`
- Role mock data imports removed from migrated pages
- Computed counts display correctly (candidateCount, submissionCount, pendingReviews)
- `npm run build` passes

---

## Phase 5: Candidates + Invite Flow End-to-End

**Goal**: Build the full vertical slice for Candidates: service module (with candidate-question assignments), API routes, React Query hooks. Migrate candidate pipeline pages, invite flow, and update `question-resolver.ts` to read from the database.

### What to build

Create the candidates service module with CRUD, status transitions (auto-setting timestamps), and invite code resolution. Wire up API routes, client functions, and React Query hooks. Migrate the candidate detail page, invite landing/start flow, and the send-to-candidate hook. Update `question-resolver.ts` to call service modules instead of importing mock data, removing the hardcoded question ID "001" override.

### Acceptance criteria

- `src/server/services/candidates.ts` created with: `listCandidates`, `getCandidateById`, `getCandidateByInviteCode`, `createCandidate`, `updateCandidate`, `updateCandidateStatus`, `deleteCandidate`
- `listCandidates` reconstructs `assignedQuestionIds` from join table
- `updateCandidateStatus` auto-sets timestamp fields (`startedAt`, `submittedAt`, `reviewedAt`)
- Zod validation schemas for candidate create/update payloads
- API routes: `GET/POST /api/candidates`, `GET/PATCH/DELETE /api/candidates/[candidateId]`, `PATCH /api/candidates/[candidateId]/status`, `GET /api/candidates/invite/[inviteCode]`
- API client functions in `src/lib/api/candidates.ts`
- React Query hooks: `useCandidatesQuery`, `useCandidateQuery`, `useCandidateByInviteCodeQuery`, `useCreateCandidateMutation`, `useUpdateCandidateMutation`, `useUpdateCandidateStatusMutation`, `useDeleteCandidateMutation`
- `src/app/recruiters/candidates/[candidateId]/page.tsx` migrated
- `src/app/invite/[code]/page.tsx` migrated: uses `useCandidateByInviteCodeQuery()`
- `src/hooks/send-to-candidate/useSendToCandidate.ts` migrated: uses API mutation hooks instead of direct store mutations
- `src/hooks/invite-landing/useInviteStart.ts` and `src/hooks/invite-page/useInviteResolution.ts` migrated
- `src/server/question-resolver.ts` updated: calls `getQuestionById()` and `getCandidateByInviteCode()` from service modules instead of importing from `src/data/`
- Hardcoded `questionId = "001"` override removed from question resolver
- `src/app/assess/[inviteCode]/page.tsx` migrated (if it exists) or invite flow pages updated
- Invite code resolution works end-to-end from Postgres
- `npm run build` passes

---

## Phase 6: Submissions + Analysis End-to-End

**Goal**: Build the full vertical slice for Submissions: service module (with session persistence and analysis storage), API routes, React Query hooks. Migrate the submission review page, candidate dashboard, and analysis flow. Wire up session data persistence on submit and analysis result storage.

### What to build

Create the submissions service module with CRUD, status transitions, session data persistence (`submitWithSession`), and analysis result storage (`saveAnalysis`). Wire up API routes, client functions, and React Query hooks. Migrate the submission review page to render chat timeline + analysis instead of evaluation breakdown. Migrate the candidate dashboard to read from submissions directly (replacing the deleted `CandidateAssessment`). Update the analysis flow to persist results to the submission record.

### Acceptance criteria

- `src/server/services/submissions.ts` created with: `listSubmissions`, `getSubmissionById`, `createSubmission`, `updateSubmission`, `updateSubmissionStatus`, `submitWithSession`, `saveAnalysis`
- `listSubmissions` joins candidate + question + role for display data
- `submitWithSession` saves `chatMessages`, `snapshots`, `initialFiles`, `finalFiles`, `timeSpent`, `timeExceeded`, `tokensIn`, `tokensOut`, `messageCount` and sets status to `submitted`
- `saveAnalysis` stores `analysisResult` jsonb on the submission
- Zod validation schemas for submission create/update/session/analysis payloads
- API routes: `GET/POST /api/submissions`, `GET/PATCH /api/submissions/[submissionId]`, `PATCH /api/submissions/[submissionId]/status`, `PUT /api/submissions/[submissionId]/session`, `PUT /api/submissions/[submissionId]/analysis`
- API client functions in `src/lib/api/submissions.ts`
- React Query hooks: `useSubmissionsQuery`, `useSubmissionQuery`, `useCreateSubmissionMutation`, `useUpdateSubmissionMutation`, `useUpdateSubmissionStatusMutation`, `useSubmitSessionMutation`, `useSaveAnalysisMutation`
- `src/app/recruiters/submissions/[submissionId]/page.tsx` migrated: renders chat timeline + analysis from submission data (not evaluationBreakdown)
- `src/app/candidates/page.tsx` migrated: uses `useSubmissionsQuery({ candidateId })` instead of `useInitializeCandidateStore`; score from `submission.analysisResult.overallScore`
- `src/app/questions/[id]/page.tsx` migrated: on submit, calls `useSubmitSessionMutation()` to persist session data
- Analysis flow updated: after `/api/analysis` generates results, `useSaveAnalysisMutation(submissionId, result)` persists to submission
- `submissionId` passed in analysis request payload
- Candidate dashboard renders submission data directly (no CandidateAssessment)
- `npm run build` passes

---

## Phase 7: Cleanup + Verification

**Goal**: Remove all mock data artifacts, dead Zustand stores, initialization hooks, and stale localStorage keys. Full end-to-end verification.

### What to build

Delete all domain Zustand stores that have been replaced by React Query. Delete initialization hooks that loaded mock data. Delete mock data files (move reusable constants to `src/lib/constants.ts`). Add one-time localStorage cleanup in root layout. Verify the entire app runs exclusively from Postgres.

### Acceptance criteria

- Deleted domain Zustand stores: `recruiterRolesStore.ts`, `recruiterCandidatesStore.ts`, `recruiterSubmissionsStore.ts`, `recruiterQuestionsStore.ts`, `candidateStore.ts`, `candidateQuestionsStore.ts`, `questionsStore.ts`
- `userStore.ts` simplified (kept until better-auth; localStorage persistence removed if mock user comes from server)
- Deleted initialization hooks: `useInitializeRecruiterData.ts`, `useInitializeCandidateStore.ts`, any other `useInitialize`* hooks
- Deleted mock data files: `src/data/recruiters.ts`, `src/data/candidates.ts`, `src/data/questions.ts`, `src/data/mock-analysis.ts`, `src/lib/mockAnalysisData.ts`
- `availableLLMModels` and `availableTestFrameworks` constants moved to `src/lib/constants.ts`
- Deleted types confirmed removed: `CandidateAssessment`, `AssessmentStatus`, `EvaluationMetric` (if fully unused)
- Stale imports fixed: any imports from `src/data/*.ts` updated to `src/types/` or `src/lib/constants.ts`
- One-time localStorage cleanup in root layout removes stale keys: `cruxai-questions`, `cruxai-recruiter-roles`, `cruxai-recruiter-candidates`, `cruxai-recruiter-submissions`, `cruxai-candidate`
- `npm run build` passes
- `npm run lint` passes
- `grep -r "src/data/recruiters" src/` returns zero runtime hits (seed script only)
- All pages load data from Postgres (verified via Network tab)
- localStorage no longer stores domain entities
- No console errors or hydration warnings
- Key flows work end-to-end:
  - Create role -> appears in dashboard
  - Create/edit question -> appears in library
  - Attach question to role -> visible in role detail
  - Invite candidate -> appears in candidate pipeline
  - Candidate starts assessment via invite link -> status updates
  - Candidate completes assessment -> chat + files persisted to submission
  - AI analysis runs and result is stored on submission
  - Recruiter views submission with chat timeline and analysis
  - Candidate dashboard shows submissions with score from analysis
- `npm run db:studio` shows all data
- README.md updated with env setup + DB commands

