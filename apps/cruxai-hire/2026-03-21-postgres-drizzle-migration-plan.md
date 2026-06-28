# Postgres + Drizzle Migration Plan

> **Date:** 2026-03-21
> **Status:** Planning
> **Supersedes:** `drizzle-implementation-plan.md`, `database-migration-plan.md`

---

## 1. Current State

### 1.1 Where Data Lives Today

| Layer | What | Storage | Persistent? |
|-------|------|---------|-------------|
| `src/data/questions.ts` | 1 static candidate question (id "001") | In-memory import | N/A |
| `src/data/recruiters.ts` | 5 job roles, 1 recruiter question, 8 candidates, 6 submissions, LLM model list, test frameworks, default metrics | In-memory import | N/A |
| `src/data/candidates.ts` | 2 mock users, 5 candidate assessments | In-memory import | N/A |
| `src/data/mock-analysis.ts` | 3 hardcoded analysis results | In-memory import | N/A |
| `questionsStore` | Questions array | localStorage (`cruxai-questions`) | Yes |
| `recruiterRolesStore` | Job roles array | localStorage (`cruxai-recruiter-roles`) | Yes |
| `recruiterCandidatesStore` | Candidates array | localStorage (`cruxai-recruiter-candidates`) | Yes |
| `recruiterSubmissionsStore` | Submissions array | localStorage (`cruxai-recruiter-submissions`) | Yes |
| `candidateStore` | Candidate assessments | localStorage (`cruxai-candidate`) | Yes |
| `userStore` | Current mock user | localStorage (`cruxai-user`) | Yes |
| `settingsStore` | API key, debug mode, debug sandbox | localStorage (`cruxai-settings`) | Yes |
| `questionSessionStore` | Chat messages, tokens, snapshots, files, test results | sessionStorage (`question_session`) | Per-tab |
| `sandboxStore` | Sandbox ID, URL, files | In-memory | No |
| `questionStateStore` | Modal, started, processed tool calls, snapshots | In-memory | No |
| `timerStore` | Timer seconds, limits | In-memory | No |
| `testResultsStore` | Jest report, flattened tests | In-memory | No |

### 1.2 How Data Gets Initialized

Mock data flows through initialization hooks on page mount:

- **Recruiter pages:** `useInitializeRecruiterData` loads `mockJobRoles`, `mockCandidates`, `mockSubmissions`, `mockRoleQuestions` into their respective stores — but only if the store is empty after hydration.
- **Candidate pages:** `useInitializeCandidateStore` loads `mockAssessments` and `mockUser` into `candidateStore` and `userStore`.
- **Question resolver (server):** `resolveQuestion()` and `resolveInviteCode()` in `src/server/question-resolver.ts` directly import from `src/data/` files. All question IDs are hardcoded to resolve to "001".

### 1.3 What API Routes Exist

Only AI/sandbox-related routes — **zero CRUD routes** for domain entities:

| Route | Purpose |
|-------|---------|
| `POST /api/chat` | Streaming AI chat with sandbox tools |
| `POST /api/analysis` | AI-generated structured analysis of candidate performance |
| `GET /api/questions/[id]` | Resolve question (reads from static data) |
| `GET /api/invite/[code]` | Resolve invite code (reads from mock data) |
| `POST /api/create-sandbox` | Create Vercel Sandbox from git repo |
| `POST /api/sandbox/read-files` | Read sandbox files |
| `POST /api/sandbox/write-file` | Write single file to sandbox |
| `POST /api/sandbox/write-files` | Batch write files to sandbox |
| `POST /api/sandbox/run-tests` | Run Jest tests in sandbox |

### 1.4 Entities and Relationships (Current)

```
User (MockUser)
  |-- role: 'recruiter' | 'candidate'
  |
  |-- [as recruiter]
  |   +-- JobRole (1:N)
  |       |-- status: draft | open | paused | closed
  |       |-- questionIds[] --> Question (M:N via array)
  |       |-- Candidate (1:N)
  |       |   |-- status: invited | started | submitted | reviewed
  |       |   |-- assignedQuestionIds[] --> Question (M:N via array)
  |       |   +-- inviteCode (unique)
  |       +-- Submission (1:N)
  |           |-- status: not_started | in_progress | submitted | reviewed
  |           |-- weightedScore
  |           +-- evaluationBreakdown: EvaluationMetric[]
  |
  +-- [as candidate]
      +-- CandidateAssessment (1:N) <-- derived, not a stored entity
          |-- questionId, roleId, companyName
          |-- status: not_started | in_progress | submitted | reviewed
          +-- score, feedback

Question (shared between recruiter/candidate)
  |-- role: frontend | backend | fullstack
  |-- difficulty: easy | medium | hard
  |-- status: draft | published | archived
  |-- repository: { url, startingBranch, targetBranch }
  |-- testConfig: { command, framework, timeout }
  |-- timeConstraints: { limit, unit, hardStop }
  |-- aiPermissions: { allowedModels[] }
  |-- evaluationMetrics: EvaluationMetric[] (name, weight, score, comments)
  |-- objective, requirements[], acceptance
```

### 1.5 Known Problems

1. **No persistence** — all data is client-side; clearing browser storage loses everything.
2. **Security** — API key stored in plaintext localStorage.
3. **No multi-user** — each browser has its own isolated data universe.
4. **Server reads mock data** — `question-resolver.ts` imports directly from `src/data/` files.
5. **Hardcoded question ID** — all question lookups resolve to "001".
6. **No auth** — `userStore` holds a mock user with no verification.
7. **Computed counts stored as data** — `candidateCount`, `submissionCount`, `pendingReviews` on `JobRole` are manually incremented/decremented in store actions rather than computed.

---

## 2. Target Architecture

### 2.1 Data Ownership

```
+-----------------------------------------------------+
|  PostgreSQL (Neon)  <-  Source of truth               |
|  Drizzle ORM        <-  Schema + query builder        |
+----------------+------------------------------------+
                 |
+----------------v------------------------------------+
|  Server modules (src/server/*)                       |
|  - Encapsulate all DB access                         |
|  - Business logic, validations, transactions         |
|  - Return data shaped to match existing TS types     |
+----------------+------------------------------------+
                 |
+----------------v------------------------------------+
|  API Route Handlers (src/app/api/*)                  |
|  - Thin request/response wrappers                    |
|  - Zod validation of request bodies                  |
|  - Delegate to server modules                        |
+----------------+------------------------------------+
                 |
+----------------v------------------------------------+
|  React Query hooks (src/hooks/api/*)                 |
|  - Queries for reads, mutations for writes           |
|  - Cache invalidation on mutation success            |
+----------------+------------------------------------+
                 |
+----------------v------------------------------------+
|  Zustand (reduced scope)                             |
|  - UI-only state: modals, tabs, editor, sandbox      |
|  - Session state: timer, snapshots, chat messages    |
|  - Settings: API key (until moved to server)         |
|  - NO domain entity persistence                      |
+-----------------------------------------------------+
```

### 2.2 Stack Choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| ORM | `drizzle-orm` | Schema-as-code, lightweight, good migration tooling |
| DB host | Neon | Serverless Postgres, edge-compatible, free tier |
| Driver | `@neondatabase/serverless` | HTTP-based, works with Next.js edge/serverless |
| Migrations | `drizzle-kit` | Generates SQL from schema diffs |
| Auth | Mock user for now; **better-auth** later | OAuth (e.g., Login with Google), user_role `recruiter`/`candidate`. Separate concern from DB migration. |
| ID strategy | UUID v4 (runtime), UUID v5 (seed) | Seed uses deterministic IDs for idempotency |

### 2.3 What Stays Client-Side

These Zustand stores remain as-is (no database involvement):

| Store | Reason |
|-------|--------|
| `settingsStore` | API key + debug mode — move API key server-side in the better-auth phase |
| `sandboxStore` | Ephemeral sandbox session state |
| `questionStateStore` | UI state for question workspace (modals, processed tool calls) |
| `questionSessionStore` | Per-question chat session (messages, snapshots, tokens). Persisted to DB when submission is created. |
| `timerStore` | In-memory timer with intervals |
| `testResultsStore` | In-memory Jest results |

### 2.4 Key Simplifications vs Current Code

These changes simplify the data model. **App code must be updated accordingly during the migration.**

| Change | What gets removed/changed | App code impact |
|--------|--------------------------|-----------------|
| **Submission includes chat history + analysis** | `weightedScore` and `evaluationBreakdown` removed from `Submission` type. Chat messages and AI analysis (from `/api/analysis`) stored on the submission instead. | Remove `evaluationBreakdown` rendering from submission detail page. Replace with chat timeline + analysis display. Remove `submission_metric_scores`-related code. |
| **CandidateAssessment = Submission** | `CandidateAssessment` type removed. Candidate dashboard reads from `submissions` table directly. | Remove `src/types/candidate.ts` `CandidateAssessment` type. Remove `candidateStore`. Candidate pages use `useSubmissionsQuery({ candidateId })` instead. |
| **Question simplified** | Remove `evaluationMetrics[]`, `acceptance`, `objective`, `requirements[]` from `Question` type and DB. | Remove `question_evaluation_metrics` table/schema. Remove these fields from question form UI. Delete `defaultEvaluationMetrics` constant. |
| **testConfig removed from DB** | `testConfig` fields (`test_command`, `test_framework`, `test_timeout_ms`) not stored in DB. | Keep testConfig fields in the question form UI but **disabled/grayed out** with a "Coming soon" indicator. Remove from API payloads and service modules. |
| **CV upload removed** | `cvData` (base64), `cvFileName` removed from `Candidate` type and all client code. No DB columns. | Remove CV upload UI from candidate invite/edit forms. Remove CV display/download from candidate detail pages. Delete `cvData` and `cvFileName` from `Candidate` type. Remove any CV-related helpers or utils. |

---

## 3. Database Schema

### 3.1 Enums

```sql
CREATE TYPE user_role AS ENUM ('recruiter', 'candidate');
CREATE TYPE role_status AS ENUM ('draft', 'open', 'paused', 'closed');
CREATE TYPE question_role AS ENUM ('frontend', 'backend', 'fullstack');
CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE question_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE candidate_status AS ENUM ('invited', 'started', 'submitted', 'reviewed');
CREATE TYPE submission_status AS ENUM ('not_started', 'in_progress', 'submitted', 'reviewed');
CREATE TYPE time_unit AS ENUM ('minutes', 'hours');
```

### 3.2 Tables

#### `users`
Canonical user identity. Serves both recruiter and candidate personas.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | Default `gen_random_uuid()` |
| `email` | text UNIQUE NOT NULL | |
| `name` | text NOT NULL | |
| `avatar_url` | text | Nullable |
| `role` | user_role NOT NULL | |
| `created_at` | timestamptz NOT NULL | Default `now()` |
| `updated_at` | timestamptz NOT NULL | Default `now()` |

**Note:** The `users` table schema is intentionally minimal. When better-auth is added, it will manage its own `user`, `session`, and `account` tables. This `users` table will either be replaced by better-auth's user table or linked to it via FK.

#### `job_roles`
Recruiter-created hiring positions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `title` | text NOT NULL | |
| `description` | text NOT NULL | Default `''` |
| `recruiter_name` | text NOT NULL | Denormalized; maps to current UI |
| `created_by_user_id` | uuid FK -> users | Nullable until auth exists |
| `status` | role_status NOT NULL | Default `'draft'` |
| `created_at` | timestamptz NOT NULL | Default `now()` |
| `updated_at` | timestamptz NOT NULL | Default `now()` |

**Indexes:** `(status)`, `(created_by_user_id, created_at DESC)`

**Note:** `candidateCount`, `submissionCount`, `pendingReviews` are NOT stored — computed via subqueries at read time.

#### `questions`
Unified question table. Simplified — no evaluation metrics, no acceptance/objective/requirements, no test config.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `title` | text NOT NULL | |
| `description` | text NOT NULL | |
| `role` | question_role NOT NULL | |
| `difficulty` | question_difficulty NOT NULL | |
| `status` | question_status NOT NULL | Default `'draft'` |
| `repository_url` | text NOT NULL | |
| `starting_branch` | text NOT NULL | |
| `target_branch` | text NOT NULL | |
| `time_limit_value` | integer | |
| `time_limit_unit` | time_unit | |
| `hard_stop` | boolean NOT NULL | Default `false` |
| `allowed_models` | text[] NOT NULL | Default `'{}'` |
| `created_by_user_id` | uuid FK -> users | Nullable |
| `created_at` | timestamptz NOT NULL | Default `now()` |
| `updated_at` | timestamptz NOT NULL | Default `now()` |

**Indexes:** `(status)`, `(role, difficulty)`

**Removed fields (vs prior plan):**
- `objective`, `requirements`, `acceptance` — removed from data model entirely
- `test_command`, `test_framework`, `test_timeout_ms` — not stored in DB; UI fields kept but disabled
- `evaluationMetrics[]` — removed; no `question_evaluation_metrics` table

#### `role_question_assignments`
M:N between job roles and questions. Replaces `JobRole.questionIds[]`.

| Column | Type | Notes |
|--------|------|-------|
| `role_id` | uuid FK -> job_roles ON DELETE CASCADE | |
| `question_id` | uuid FK -> questions ON DELETE CASCADE | |
| `assigned_at` | timestamptz NOT NULL | Default `now()` |

**PK:** `(role_id, question_id)`

#### `candidates`
Invited candidates per role.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `role_id` | uuid FK -> job_roles ON DELETE CASCADE | |
| `user_id` | uuid FK -> users | Nullable; linked when candidate creates account via better-auth |
| `name` | text NOT NULL | |
| `email` | text NOT NULL | |
| `status` | candidate_status NOT NULL | Default `'invited'` |
| `invite_code` | text UNIQUE NOT NULL | |
| `notes` | text | |
| `invited_at` | timestamptz NOT NULL | Default `now()` |
| `started_at` | timestamptz | |
| `submitted_at` | timestamptz | |
| `reviewed_at` | timestamptz | |
| `created_at` | timestamptz NOT NULL | Default `now()` |
| `updated_at` | timestamptz NOT NULL | Default `now()` |

**Indexes:** `(role_id, status)`, `(email)`, `(invite_code)` (unique)

#### `candidate_question_assignments`
Explicit M:N replacing `Candidate.assignedQuestionIds[]`.

| Column | Type | Notes |
|--------|------|-------|
| `candidate_id` | uuid FK -> candidates ON DELETE CASCADE | |
| `question_id` | uuid FK -> questions ON DELETE CASCADE | |
| `assigned_at` | timestamptz NOT NULL | Default `now()` |

**PK:** `(candidate_id, question_id)`

#### `submissions`
The core assessment record. Stores the candidate's chat session, AI analysis, and status. **Used by both recruiter and candidate views** (replaces the old separate `CandidateAssessment` concept).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `candidate_id` | uuid FK -> candidates ON DELETE CASCADE | |
| `role_id` | uuid FK -> job_roles ON DELETE CASCADE | |
| `question_id` | uuid FK -> questions ON DELETE CASCADE | |
| `status` | submission_status NOT NULL | Default `'not_started'` |
| `time_spent` | text | Formatted duration (e.g., "45:30") |
| `time_exceeded` | boolean NOT NULL | Default `false` |
| `tokens_in` | integer NOT NULL | Default `0` |
| `tokens_out` | integer NOT NULL | Default `0` |
| `message_count` | integer NOT NULL | Default `0` |
| `chat_messages` | jsonb | Full chat history (array of `{ role, content }` messages) |
| `snapshots` | jsonb | Timeline snapshots (array of `TimelineSnapshot` objects) |
| `initial_files` | jsonb | File state at start of session |
| `final_files` | jsonb | File state at end of session |
| `analysis_result` | jsonb | AI analysis output: `{ overallScore, messageInsights[] }` from `/api/analysis` |
| `started_at` | timestamptz | |
| `submitted_at` | timestamptz | |
| `reviewed_at` | timestamptz | |
| `created_at` | timestamptz NOT NULL | Default `now()` |
| `updated_at` | timestamptz NOT NULL | Default `now()` |

**Unique:** `(candidate_id, question_id)`
**Indexes:** `(role_id, status)`, `(candidate_id, status)`

**Key changes vs prior plan:**
- **Added:** `chat_messages`, `snapshots`, `initial_files`, `final_files`, `analysis_result`, `time_spent`, `time_exceeded`, `tokens_in`, `tokens_out`, `message_count`, `started_at`
- **Removed:** `weighted_score`, `candidate_name`, `candidate_email` (derive from `candidates` join instead of snapshotting)
- **Removed:** `submission_metric_scores` table entirely (no evaluationBreakdown)
- **CandidateAssessment is now just a submission** — the candidate dashboard queries `submissions` filtered by `candidate_id`

### 3.3 Future Tables

| Table | Purpose | When |
|-------|---------|------|
| `activities` | Audit log of role/candidate/submission events | When activity feed is needed |
| better-auth tables (`user`, `session`, `account`, `verification`) | Auth infrastructure | When implementing better-auth |

### 3.4 Entity Relationship Diagram

```
users
  |
  |--1:N--> job_roles (created_by_user_id)
  |           |
  |           |--M:N--> questions (via role_question_assignments)
  |           |
  |           |--1:N--> candidates
  |           |           |
  |           |           |--M:N--> questions (via candidate_question_assignments)
  |           |           |
  |           |           +--1:N--> submissions
  |           |                      (chat_messages, analysis_result as jsonb)
  |           |
  |           +--1:N--> submissions (denormalized role_id)
  |
  +--1:N--> candidates (user_id, when candidate logs in via better-auth)
```

---

## 4. Field Mapping Reference

### JobRole -> `job_roles`

| Current Field | DB Column / Strategy |
|---------------|---------------------|
| `id` | `id` (uuid) |
| `title` | `title` |
| `description` | `description` |
| `recruiterName` | `recruiter_name` |
| `status` | `status` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `questionIds: string[]` | -> `role_question_assignments` join table |
| `candidateCount` | **Computed:** `COUNT(*) FROM candidates WHERE role_id = ?` |
| `submissionCount` | **Computed:** `COUNT(*) FROM submissions WHERE role_id = ?` |
| `pendingReviews` | **Computed:** `COUNT(*) FROM submissions WHERE role_id = ? AND status = 'submitted'` |

### Question -> `questions`

| Current Field | DB Column / Strategy |
|---------------|---------------------|
| `id` | `id` (uuid) |
| `title`, `description` | Direct columns |
| `role`, `difficulty`, `status` | Enum columns |
| `repository.url` | `repository_url` |
| `repository.startingBranch` | `starting_branch` |
| `repository.targetBranch` | `target_branch` |
| `timeConstraints.limit` | `time_limit_value` |
| `timeConstraints.unit` | `time_limit_unit` |
| `timeConstraints.hardStop` | `hard_stop` |
| `aiPermissions.allowedModels` | `allowed_models` (text[]) |
| `createdAt`, `updatedAt` | Direct timestamp columns |
| ~~`objective`~~ | **REMOVED** — delete from `Question` type and UI |
| ~~`requirements[]`~~ | **REMOVED** — delete from `Question` type and UI |
| ~~`acceptance`~~ | **REMOVED** — delete from `Question` type and UI |
| ~~`testConfig.*`~~ | **NOT IN DB** — keep in UI as disabled fields only |
| ~~`evaluationMetrics[]`~~ | **REMOVED** — delete from `Question` type, UI, and remove `question_evaluation_metrics` table |

### Candidate -> `candidates`

| Current Field | DB Column / Strategy |
|---------------|---------------------|
| `id` | `id` (uuid) |
| `roleId` | `role_id` (FK) |
| `name`, `email` | Direct columns |
| `status` | `status` enum |
| `inviteCode` | `invite_code` (unique) |
| `notes` | `notes` |
| ~~`cvFileName`~~ | **REMOVED** — CV feature removed from app |
| ~~`cvData`~~ | **REMOVED** — CV feature removed from app |
| `assignedQuestionIds[]` | -> `candidate_question_assignments` join table |
| `invitedAt`, `startedAt`, `submittedAt`, `reviewedAt` | Direct timestamp columns |

### Submission -> `submissions`

| Current Field | DB Column / Strategy |
|---------------|---------------------|
| `id` | `id` (uuid) |
| `roleId`, `questionId`, `candidateId` | FK columns |
| `status` | `status` enum |
| `submittedAt` | `submitted_at` |
| ~~`weightedScore`~~ | **REMOVED** — score comes from `analysis_result.overallScore` |
| ~~`candidateName`, `candidateEmail`~~ | **REMOVED** — derive from `candidates` join |
| ~~`evaluationBreakdown[]`~~ | **REMOVED** — no `submission_metric_scores` table |
| **(new)** `chat_messages` | jsonb — full chat history |
| **(new)** `snapshots` | jsonb — timeline snapshots |
| **(new)** `initial_files`, `final_files` | jsonb — code file snapshots |
| **(new)** `analysis_result` | jsonb — `{ overallScore, messageInsights[] }` |
| **(new)** `time_spent`, `time_exceeded` | Duration tracking |
| **(new)** `tokens_in`, `tokens_out`, `message_count` | Usage stats |
| **(new)** `started_at` | When candidate began |

### CandidateAssessment -> `submissions` (same table)

The old `CandidateAssessment` type is **deleted**. The candidate dashboard reads from `submissions` directly.

| Old CandidateAssessment Field | New Source |
|-------------------------------|-----------|
| `questionId` | `submissions.question_id` |
| `questionTitle` | `questions.title` (via join) |
| `roleId` | `submissions.role_id` |
| `roleTitle` | `job_roles.title` (via join) |
| `companyName` | `job_roles.recruiter_name` (via join) |
| `status` | `submissions.status` |
| `timeLimit` | `questions.time_limit_value` + `questions.time_limit_unit` (via join) |
| `score` | `submissions.analysis_result->>'overallScore'` |
| `feedback` | `submissions.analysis_result` (full analysis) |
| `assignedAt` | `candidate_question_assignments.assigned_at` |
| `startedAt`, `submittedAt`, `reviewedAt` | `submissions.*_at` timestamps |

**App code changes required:**
- Delete `CandidateAssessment` type from `src/types/candidate.ts`
- Delete `candidateStore.ts` (assessments store)
- Update `src/app/candidates/page.tsx` to use `useSubmissionsQuery({ candidateId })` instead of `useInitializeCandidateStore`
- Candidate dashboard renders submission data directly

---

## 5. Implementation Phases

### Phase 0: Drizzle Setup (No Page Changes)

**Goal:** Install dependencies, configure Drizzle, connect to Neon. App still runs on mock data.

#### Tasks:

1. **Install dependencies**
   ```
   npm install drizzle-orm @neondatabase/serverless
   npm install -D drizzle-kit dotenv tsx
   ```

2. **Add scripts to `package.json`**
   ```json
   "db:generate": "drizzle-kit generate",
   "db:migrate": "drizzle-kit migrate",
   "db:push": "drizzle-kit push",
   "db:studio": "drizzle-kit studio",
   "db:seed": "tsx src/server/db/seed.ts"
   ```

3. **Create `drizzle.config.ts`** at project root — points to schema directory, PostgreSQL dialect, `DATABASE_URL` env var.

4. **Add env vars** to `.env.local`:
   ```
   DATABASE_URL=postgresql://...
   ```

5. **Create DB client singleton** at `src/server/db/index.ts` — export `db` using Neon serverless driver.

6. **Verify:** `npm run build` still passes, no pages touched.

---

### Phase 1: Schema + Migrations

**Goal:** Define all Drizzle schema files, generate and run the initial migration, seed from mock data.

#### Files to create:

```
src/server/db/
+-- index.ts              (DB client singleton -- Phase 0)
+-- schema/
|   +-- index.ts          (barrel export)
|   +-- enums.ts          (all pgEnum definitions)
|   +-- users.ts
|   +-- job-roles.ts
|   +-- questions.ts
|   +-- role-question-assignments.ts
|   +-- candidates.ts
|   +-- candidate-question-assignments.ts
|   +-- submissions.ts
|   +-- relations.ts      (Drizzle relations for relational queries)
+-- seed.ts               (seed script)
```

**Note:** No `evaluation-metrics.ts` or `submission-metric-scores.ts` — those tables are removed.

#### Seed script design:
- Import mock data from `src/data/recruiters.ts`, `src/data/candidates.ts`, `src/data/questions.ts`
- Map string IDs (e.g., `role-001`) to deterministic UUIDs via UUID v5
- Insert in dependency order: users -> job_roles -> questions -> role_question_assignments -> candidates -> candidate_question_assignments -> submissions
- Use `ON CONFLICT DO NOTHING` for idempotency
- Seed submissions with empty `chat_messages` and `analysis_result` (mock data doesn't have these)

#### Verification:
- `npm run db:generate` — generates SQL migration
- `npm run db:migrate` — applies to Neon
- `npm run db:seed` — populates data
- `npm run db:studio` — visually inspect all tables
- `npm run build` — still passes (no pages touched)

---

### Phase 2: Server Data Access Layer + App Code Changes

**Goal:** Build server-side service modules. Also update TypeScript types and app code to reflect the simplified data model. No page data-source changes yet (still mock data), but types and UI adapt.

#### 2a. Update TypeScript types

**`src/types/question-shared.ts`:**
- Remove `objective`, `requirements`, `acceptance` fields from `Question` type
- Remove `EvaluationMetric` type (or keep only as a UI-only concept if still rendered somewhere)
- Remove `TestConfig` type from the data model (keep as UI-only disabled fields)
- Remove `testConfig` from `Question` type

**`src/types/candidate.ts`:**
- Delete `CandidateAssessment` type entirely
- Delete `AssessmentStatus` type (use `SubmissionStatus` from `recruiter.ts` instead)

**`src/types/recruiter.ts`:**
- Remove `weightedScore` and `evaluationBreakdown` from `Submission` type
- Add to `Submission`: `chatMessages`, `snapshots`, `initialFiles`, `finalFiles`, `analysisResult`, `timeSpent`, `timeExceeded`, `tokensIn`, `tokensOut`, `messageCount`, `startedAt`
- Remove `candidateName`, `candidateEmail` from `Submission` (derive via join)
- Remove `cvData` and `cvFileName` from `Candidate` type

#### 2b. Update app code for removed fields

- **Question form** (`src/hooks/recruiter-question-editor/useRecruiterQuestionForm.ts`): Remove `objective`, `requirements`, `acceptance` form fields. Keep `testConfig` fields in form but mark as disabled in the UI component.
- **Question detail pages**: Remove rendering of `objective`, `requirements`, `acceptance`, `evaluationMetrics`.
- **Submission detail page**: Remove `evaluationBreakdown` / `weightedScore` rendering. Add chat history timeline and analysis result display.
- **Candidate dashboard**: Replace `CandidateAssessment` usage with `Submission` type. Score comes from `submission.analysisResult.overallScore`.
- **Candidate forms/detail pages**: Remove CV upload UI (file input, preview, download link). Remove `cvData` and `cvFileName` from form state and API payloads.
- **Analysis route** (`src/app/api/analysis/route.ts`): No structural change — it already returns `{ overallScore, messageInsights[] }`. The result will be stored on the submission.

#### 2c. Service modules to create

**`src/server/services/roles.ts`**
- `listRoles(filters?)` -> `JobRole[]` — computes `candidateCount`, `submissionCount`, `pendingReviews`, `questionIds` via subqueries/joins
- `getRoleById(id)` -> `JobRole | null`
- `createRole(data)` -> `JobRole` — inserts role + role_question_assignments in transaction
- `updateRole(id, updates)` -> `JobRole`
- `deleteRole(id)` -> void
- `updateRoleStatus(id, status)` -> `JobRole`
- `setRoleQuestions(roleId, questionIds)` -> void — delete + insert assignments in transaction

**`src/server/services/questions.ts`**
- `listQuestions(filters?)` -> `Question[]`
- `getQuestionById(id)` -> `Question | null`
- `getQuestionsByIds(ids)` -> `Question[]`
- `createQuestion(data)` -> `Question`
- `updateQuestion(id, updates)` -> `Question`
- `deleteQuestion(id)` -> void
- `duplicateQuestion(id)` -> `Question`

**`src/server/services/candidates.ts`**
- `listCandidates(filters?)` -> `Candidate[]` — reconstructs `assignedQuestionIds` from join table
- `getCandidateById(id)` -> `Candidate | null`
- `getCandidateByInviteCode(code)` -> `Candidate | null`
- `createCandidate(data)` -> `Candidate` — inserts candidate + candidate_question_assignments
- `updateCandidate(id, updates)` -> `Candidate`
- `updateCandidateStatus(id, status)` -> `Candidate` — auto-sets timestamp fields
- `deleteCandidate(id)` -> void

**`src/server/services/submissions.ts`**
- `listSubmissions(filters?)` -> `Submission[]` — joins candidate + question + role for display names
- `getSubmissionById(id)` -> `Submission | null`
- `createSubmission(data)` -> `Submission` — creates with status `not_started`, empty chat/analysis
- `updateSubmission(id, updates)` -> `Submission`
- `updateSubmissionStatus(id, status)` -> `Submission` — auto-sets timestamps
- `submitWithSession(id, sessionData)` -> `Submission` — saves chat_messages, snapshots, files, time/token stats, sets status to `submitted`
- `saveAnalysis(id, analysisResult)` -> `Submission` — stores AI analysis result on the submission

**No `assessments.ts` service** — candidate dashboard queries `submissions` directly via `listSubmissions({ candidateId })`.

#### 2d. Update `question-resolver.ts`:
- Replace `import { mockCandidates, ... } from '@/data/recruiters'` with calls to service modules
- `resolveQuestion()` calls `getQuestionById()` from DB
- `resolveInviteCode()` calls `getCandidateByInviteCode()` from DB
- Remove the hardcoded `questionId = "001"` override

#### 2e. Update analysis route:
- After `/api/analysis` generates results, also call `saveAnalysis(submissionId, result)` to persist the analysis on the submission record
- Requires passing `submissionId` in the analysis request payload

#### Verification:
- TypeScript compiles with updated types
- Question form renders without removed fields
- `npm run build` passes

---

### Phase 3: API Routes

**Goal:** Thin request/response handlers that call service modules. Zod validation for request bodies.

#### Validation schemas:
Create `src/server/validation/` with Zod schemas for create/update payloads per entity.

#### Routes to create:

| Route | Methods | Service Calls |
|-------|---------|---------------|
| `/api/roles` | GET, POST | `listRoles`, `createRole` |
| `/api/roles/[roleId]` | GET, PATCH, DELETE | `getRoleById`, `updateRole`, `deleteRole` |
| `/api/roles/[roleId]/status` | PATCH | `updateRoleStatus` |
| `/api/roles/[roleId]/questions` | PUT | `setRoleQuestions` |
| `/api/questions` | GET, POST | `listQuestions`, `createQuestion` |
| `/api/questions/[questionId]` | GET, PATCH, DELETE | `getQuestionById`, `updateQuestion`, `deleteQuestion` |
| `/api/questions/[questionId]/duplicate` | POST | `duplicateQuestion` |
| `/api/candidates` | GET, POST | `listCandidates`, `createCandidate` |
| `/api/candidates/[candidateId]` | GET, PATCH, DELETE | `getCandidateById`, `updateCandidate`, `deleteCandidate` |
| `/api/candidates/[candidateId]/status` | PATCH | `updateCandidateStatus` |
| `/api/candidates/invite/[inviteCode]` | GET | `getCandidateByInviteCode` |
| `/api/submissions` | GET, POST | `listSubmissions`, `createSubmission` |
| `/api/submissions/[submissionId]` | GET, PATCH | `getSubmissionById`, `updateSubmission` |
| `/api/submissions/[submissionId]/status` | PATCH | `updateSubmissionStatus` |
| `/api/submissions/[submissionId]/session` | PUT | `submitWithSession` — saves chat/files/stats |
| `/api/submissions/[submissionId]/analysis` | PUT | `saveAnalysis` — persists AI analysis |

**Removed (vs prior plan):** `/api/assessments` route — candidate dashboard uses `/api/submissions?candidateId=...` instead.

**Pattern for each handler:**
1. Parse + validate request body/params with Zod
2. Call service function
3. Return JSON response (or error with appropriate status code)

#### Verification:
- Test each endpoint with curl/Postman
- Verify response shapes match updated TypeScript types
- `npm run build` passes

---

### Phase 4: React Query Hooks

**Goal:** Create client-side API functions and React Query hooks that run alongside existing Zustand. No pages change yet.

#### API client functions:
Create `src/lib/api/` with one file per entity:
- `roles.ts` — `fetchRoles`, `fetchRole`, `createRole`, `updateRole`, `deleteRole`, `updateRoleStatus`, `setRoleQuestions`
- `questions.ts` — `fetchQuestions`, `fetchQuestion`, `createQuestion`, `updateQuestion`, `deleteQuestion`, `duplicateQuestion`
- `candidates.ts` — `fetchCandidates`, `fetchCandidate`, `fetchCandidateByInviteCode`, `createCandidate`, `updateCandidate`, `updateCandidateStatus`, `deleteCandidate`
- `submissions.ts` — `fetchSubmissions`, `fetchSubmission`, `createSubmission`, `updateSubmission`, `updateSubmissionStatus`, `submitSession`, `saveAnalysis`

#### React Query hooks:
Create `src/hooks/api/` with query and mutation hooks:

**Queries:** `useRolesQuery`, `useRoleQuery`, `useQuestionsQuery`, `useQuestionQuery`, `useCandidatesQuery`, `useCandidateQuery`, `useCandidateByInviteCodeQuery`, `useSubmissionsQuery`, `useSubmissionQuery`

**Mutations:** `useCreateRoleMutation`, `useUpdateRoleMutation`, `useDeleteRoleMutation`, `useUpdateRoleStatusMutation`, `useSetRoleQuestionsMutation`, `useCreateQuestionMutation`, `useUpdateQuestionMutation`, `useDeleteQuestionMutation`, `useDuplicateQuestionMutation`, `useCreateCandidateMutation`, `useUpdateCandidateMutation`, `useUpdateCandidateStatusMutation`, `useCreateSubmissionMutation`, `useUpdateSubmissionMutation`, `useUpdateSubmissionStatusMutation`, `useSubmitSessionMutation`, `useSaveAnalysisMutation`

**Mutation pattern:**
```typescript
const mutation = useMutation({
  mutationFn: (data) => apiClient.createRole(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  },
});
```

#### Verification:
- Import a query hook in a test component and verify it fetches from the API
- `npm run build` passes

---

### Phase 5: Page-by-Page Migration

**Goal:** Replace mock data initialization + Zustand reads with React Query hooks, one page at a time.

#### Migration pattern per page:
1. Remove mock data imports (`import { mockJobRoles, ... } from '@/data/recruiters'`)
2. Remove initialization hook call (`useInitializeRecruiterData(...)`)
3. Replace Zustand store reads -> React Query queries
4. Replace Zustand store mutations -> React Query mutations
5. Replace `hasHydrated` loading gate -> `isLoading` / `isPending` from query hooks
6. Keep Zustand for UI-only state (modals, tabs, search filters)

#### Migration order:

| # | Page / Hook | What Changes |
|---|-------------|-------------|
| 1 | `src/app/recruiters/page.tsx` | Drop `useInitializeRecruiterData`. Use `useRolesQuery()` + `useCandidatesQuery()`. Replace store mutations (removeRole, updateRoleStatus, addCandidate, incrementCandidateCount) with mutation hooks. |
| 2 | `src/app/recruiters/questions/page.tsx` | Drop questions store initialization. Use `useQuestionsQuery()` + `useRolesQuery()`. |
| 3 | `src/app/recruiters/questions/[questionId]/page.tsx` | Use `useQuestionQuery(questionId)`. Replace `updateQuestion`/`addQuestion` with mutations. Remove evaluation metrics UI. |
| 4 | `src/app/recruiters/roles/new/page.tsx` | Use `useQuestionsQuery()` for question picker. Replace `addRole` with `useCreateRoleMutation()`. |
| 5 | `src/app/recruiters/roles/[roleId]/page.tsx` | Use `useRoleQuery` + `useSubmissionsQuery({ roleId })` + `useCandidatesQuery({ roleId })`. |
| 6 | `src/app/recruiters/roles/[roleId]/questions/[questionId]/page.tsx` | Same as #3, scoped to role. |
| 7 | `src/app/recruiters/candidates/[candidateId]/page.tsx` | Use `useCandidateQuery(candidateId)` + join queries for role/questions. |
| 8 | `src/app/recruiters/submissions/[submissionId]/page.tsx` | Use `useSubmissionQuery(submissionId)`. Render chat timeline + analysis from submission data instead of evaluationBreakdown. |
| 9 | `src/app/candidates/page.tsx` | Drop `useInitializeCandidateStore`. Use `useSubmissionsQuery({ candidateId })` — CandidateAssessment is gone, read submissions directly. Score from `submission.analysisResult.overallScore`. |
| 10 | `src/app/questions/page.tsx` | Use `useQuestionsQuery({ status: 'published' })` for candidate catalog. |
| 11 | `src/app/questions/[id]/page.tsx` | Use `useQuestionQuery(id)`. Keep sandbox/timer/chat stores unchanged. On submit, call `useSubmitSessionMutation()` to persist session data to submission. |
| 12 | `src/app/assess/[inviteCode]/page.tsx` | Use `useCandidateByInviteCodeQuery(inviteCode)`. Replace 4-store hydration + manual lookups. On submit, persist session to submission. |
| 13 | `src/hooks/send-to-candidate/useSendToCandidate.ts` | Replace direct store mutations with API mutation hooks. |
| 14 | Analysis flow | After analysis completes, call `useSaveAnalysisMutation(submissionId, result)` to persist to submission record. |

#### Verification per page:
- Navigate to page, check Network tab for API calls
- Test all CRUD operations
- Confirm loading/error states render correctly
- `npm run lint` passes

---

### Phase 6: Cleanup

**Goal:** Remove all mock data artifacts and dead code.

#### Delete domain Zustand stores:
- `src/stores/recruiterRolesStore.ts`
- `src/stores/recruiterCandidatesStore.ts`
- `src/stores/recruiterSubmissionsStore.ts`
- `src/stores/recruiterQuestionsStore.ts` (alias)
- `src/stores/candidateStore.ts` — **fully deleted** (CandidateAssessment no longer exists)
- `src/stores/candidateQuestionsStore.ts` (alias)
- `src/stores/questionsStore.ts`

#### Keep (simplify `userStore`):
- `userStore` — still needed until better-auth is added. Remove localStorage persistence if mock user comes from server.

#### Delete initialization hooks:
- `src/hooks/recruiter/useInitializeRecruiterData.ts`
- `src/hooks/candidates-page/useInitializeCandidateStore.ts`
- Any other `useInitialize*` hooks that load mock data

#### Clean up mock data files:
- `src/data/recruiters.ts` — DELETE domain data + helpers. **Move** reference constants (`availableLLMModels`, `availableTestFrameworks`) to `src/lib/constants.ts`. Delete `defaultEvaluationMetrics` (no longer used).
- `src/data/candidates.ts` — DELETE
- `src/data/questions.ts` — DELETE
- `src/data/mock-analysis.ts` — DELETE
- `src/lib/mockAnalysisData.ts` — DELETE

#### Clean up removed types:
- Delete `CandidateAssessment`, `AssessmentStatus` from `src/types/candidate.ts`
- Delete `EvaluationMetric` from `src/types/question-shared.ts` (if fully unused)
- Delete `objective`, `requirements`, `acceptance`, `testConfig` from `Question` type (done in Phase 2)
- Delete `cvData`, `cvFileName` from `Candidate` type and all related UI/helpers (done in Phase 2)

#### Fix remaining imports:
- Update any imports that went through `src/data/*.ts` for types to import from `src/types/` directly.

#### Clean stale localStorage:
- Add one-time cleanup in root layout that removes stale keys: `cruxai-questions`, `cruxai-recruiter-roles`, `cruxai-recruiter-candidates`, `cruxai-recruiter-submissions`, `cruxai-candidate`.

#### Verification:
- `npm run build` passes
- `npm run lint` passes
- `grep -r "src/data/recruiters" src/` returns zero runtime hits (seed script only)
- All pages load from Postgres (Network tab)
- localStorage no longer stores domain entities

---

## 6. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Computed counts (candidateCount, etc.) drift from UI expectations | Medium | Compute via SQL subqueries in service layer; return consistent DTOs |
| Status transitions become inconsistent | High | Centralize all transitions in server services with validation; reject invalid transitions |
| Large chat_messages jsonb | Medium | Chat can be long. Consider pagination or lazy-loading for submission detail. Index not needed (no filtering by content). |
| Breaking pages during incremental migration | High | Migrate one page at a time; keep mock path working until page is fully migrated |
| Hydration mismatches during transition | Medium | React Query's `isLoading` replaces Zustand's `_hasHydrated` — simpler and more reliable |
| question-resolver.ts serves both old and new paths | Low | Update it in Phase 2 (service layer); it already has TODOs for this |
| Removing evaluationMetrics/acceptance/objective/requirements from Question | Low | UI components that render these fields need cleanup. Grep for field names and remove. |

---

## 7. Open Decisions

| Decision | Options | Recommendation |
|----------|---------|----------------|
| DB host | Neon, Supabase, local Docker | **Neon** — serverless, edge-compatible, free tier |
| Auth | better-auth (confirmed) | Separate phase after DB migration. OAuth with Google. User types: recruiter/candidate. |
| API layer | REST routes vs tRPC | **REST routes** — simpler, already have the pattern |
| Optimistic updates | React Query optimistic mutations vs wait for server | **Wait for server** initially; add optimistic updates per-page if latency is noticeable |
| Chat storage format | jsonb array vs separate `session_messages` table | **jsonb** — simpler, no need to query individual messages. Revisit if chat replay needs pagination. |

---

## 8. Definition of Done

- [ ] All recruiter/candidate/question/submission data comes from Postgres via Drizzle
- [ ] No runtime imports of mock data in production paths
- [ ] Hydration hooks that seed stores from mock data are removed
- [ ] `question-resolver.ts` reads from database, not static imports
- [ ] `CandidateAssessment` type is deleted; candidate dashboard reads `submissions`
- [ ] `evaluationMetrics`, `acceptance`, `objective`, `requirements` removed from Question type and UI
- [ ] `testConfig` fields present in UI but disabled (not stored in DB)
- [ ] Submissions store chat history and AI analysis results
- [ ] Key flows work end-to-end:
  - Create role -> appears in dashboard
  - Create/edit question -> appears in library (without removed fields)
  - Attach question to role -> visible in role detail
  - Invite candidate -> appears in candidate pipeline
  - Candidate starts assessment via invite link -> status updates
  - Candidate completes assessment -> chat + files persisted to submission
  - AI analysis runs and result is stored on submission
  - Recruiter views submission with chat timeline and analysis
  - Candidate dashboard shows submissions with score from analysis
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run db:studio` shows all data
- [ ] localStorage no longer stores domain entities
- [ ] No console errors or hydration warnings
- [ ] README.md updated with env setup + DB commands
