# Plan: Background Analysis & Server-Side Token Tracking via Next.js `after()`

> Generated from: plans/background-analysis-after.md
> Date: 2026-03-23

## Overview

Track all token usage (chat + analysis) server-side via `after()`, unify the submission model so both invite and non-invite flows create submissions, and trigger background analysis when candidates complete the invite flow — so recruiters see scores without the candidate ever visiting the analysis page.

---

## Tasks

### Task 1: Unify Submission Data Model

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

Make `inviteId` nullable on the submissions schema and add a `questionId` column so both invite and non-invite flows can create submissions. Update all layers: DB schema, Drizzle migration, TypeScript types, Zod validation schemas, and the `createSubmission`/`toSubmission` service functions.

Reference: PRD Phase 1, sections 1.1–1.4.

#### Acceptance criteria

- [ ] `inviteId` column is nullable in `src/server/db/schema/submissions.ts`
- [ ] `questionId` column added with FK to `questions.id`
- [ ] Migration generated and applied (`npm run db:generate && npm run db:migrate`)
- [ ] `Submission` type in `src/types/recruiter.ts` includes `questionId: string` and `inviteId` is optional
- [ ] `toSubmission()` in `src/server/services/submissions.ts` maps `questionId`
- [ ] `createSubmission` accepts `{ inviteId?: string; questionId: string }`
- [ ] `createSubmissionSchema` in `src/server/validation/submissions.ts` updated accordingly
- [ ] `npm run build` passes; existing invite flow still works

#### User stories addressed

- Both flows create a submission and share the same token tracking code
- Non-invite sessions can now have a submission record

---

### Task 2: Wire Both Flows to Create Submissions

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Non-invite flow: create a submission when the candidate clicks "Start" on the question page (after `initSession`), storing the `submissionId` in `questionSessionStore`. Invite flow: update `useInviteStart` to pass `questionId` to `createSubmission` and ensure `submissionId` is stored in the session store. Update the submissions API route to accept the new schema.

Reference: PRD Phase 1, sections 1.5–1.7.

#### Acceptance criteria

- [ ] Non-invite flow creates a submission on question start in `src/app/questions/[id]/page.tsx`
- [ ] `submissionId` is set in `questionSessionStore` for both flows
- [ ] `useInviteStart` passes `questionId` when calling `createSubmission`
- [ ] Submissions API POST route works with the updated validation schema
- [ ] Starting a question (with or without invite) creates a submission row in DB with correct `questionId`

#### User stories addressed

- Both flows create a submission and share the same token tracking code

---

### Task 3: Server-Side Chat Token Tracking via `after()`

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Add an `incrementTokenUsage` service function that atomically increments `tokensIn`/`tokensOut` on a submission using SQL `COALESCE + addition`. Restructure `handleChatRequest` in `src/server/chat.ts` to accept an optional `onFinish` callback that receives usage data (instead of returning `createAgentUIStreamResponse` directly). Update the chat API route to call `incrementTokenUsage` inside `after()` when `submissionId` is provided. Pass `submissionId` from the client's `questionSessionStore` to the chat route request body.

Reference: PRD Phase 2, sections 2.1–2.4.

#### Acceptance criteria

- [ ] `incrementTokenUsage(id, tokensIn, tokensOut)` added to `src/server/services/submissions.ts` with atomic SQL increment
- [ ] `handleChatRequest` restructured to expose usage via `onFinish` callback (streaming response unchanged)
- [ ] Chat route imports `after` from `next/server` and calls `incrementTokenUsage` when `submissionId` is present
- [ ] Client passes `submissionId` in the chat request body
- [ ] Sending chat messages increments `tokensIn`/`tokensOut` on the submission row in DB
- [ ] Streaming response to the client is unaffected

#### User stories addressed

- Track ALL token usage (chat + analysis) server-side, persisted to a submission in the DB

---

### Task 4: Add `analyzing` Submission Status

- **Type**: AFK
- **Blocked by**: None - can start immediately (parallel with Tasks 1–3)

#### What to build

Add `'analyzing'` to the submission status enum across all layers: DB enum in `src/server/db/schema/enums.ts`, TypeScript type in `src/types/recruiter.ts`, Zod validation schemas in `src/server/validation/submissions.ts`, timestamp mapping in `updateSubmissionStatus`, the recruiter status select component, and the recruiter submission detail page (show "Analysis in progress" with spinner).

Reference: PRD Phase 3, sections 3.1–3.6.

#### Acceptance criteria

- [ ] `'analyzing'` added to `submissionStatusEnum` in DB schema
- [ ] Migration generated and applied
- [ ] `SubmissionStatus` type includes `'analyzing'`
- [ ] Zod schemas for `updateSubmissionSchema` and `updateSubmissionStatusSchema` include `'analyzing'`
- [ ] `updateSubmissionStatus` timestamp mapping handles `'analyzing'`
- [ ] `SubmissionStatusSelect` component includes "Analyzing" option
- [ ] Recruiter submission page shows "Analysis in progress" state for `analyzing` status

#### User stories addressed

- Recruiter can distinguish "waiting for analysis" from "analysis actively running"

---

### Task 5: Background Analysis Runner + Trigger

- **Type**: AFK
- **Blocked by**: Tasks 2, 3, 4

#### What to build

Extract shared message/snapshot conversion utilities from `useTriggerQuestionAnalysis` into `src/lib/analysisUtils.ts` (pure functions: `extractMessageContent`, `simplifyMessages`, `snapshotsToSystemMessages`). Update the hook to import from the shared module. Create `src/server/runBackgroundAnalysis.ts` — an async function that fetches submission data, sets status to `analyzing`, calls `generateText()` with the analysis prompt and schema, persists results via `saveAnalysis`, and increments token usage for the analysis call. Wire it up in the session submission route (`src/app/api/submissions/[submissionId]/session/route.ts`) via `after()`, guarded by `!submission.analysisResult`.

Reference: PRD Phase 4–5, sections 4.1–4.2 and 5.

#### Acceptance criteria

- [ ] `src/lib/analysisUtils.ts` created with `extractMessageContent`, `simplifyMessages`, `snapshotsToSystemMessages`
- [ ] `useTriggerQuestionAnalysis` imports from shared utils (no duplication)
- [ ] `src/server/runBackgroundAnalysis.ts` created; uses existing service functions (no duplication)
- [ ] Background analysis sets status to `analyzing`, then `reviewed` on completion
- [ ] Analysis tokens added on top of chat tokens via `incrementTokenUsage`
- [ ] Session submission route triggers `runBackgroundAnalysis` via `after()` with duplicate guard
- [ ] End-to-end: complete invite flow → thank-you redirect → submission transitions `analyzing` → `reviewed` with score, insights, and accurate total token counts

#### User stories addressed

- Trigger analysis as a background task when the candidate submits (invite flow)
- Track ALL token usage (chat + analysis) server-side

---

### Task 6: Clean Up Client-Side Token Tracking + Non-Invite Analysis

- **Type**: AFK
- **Blocked by**: Tasks 3, 5

#### What to build

Remove client-side token tracking code that is now redundant: `incrementTokensIn`/`incrementTokensOut` actions from `questionSessionStore`, the `useEffect` in the analysis page that increments tokens from the analysis response, and the token fields from `submitWithSession` calls. Update `handleEndQuestion` so both flows submit session data to the submission (not just the invite flow). Update the `/api/analysis` route to persist analysis tokens via `after()` when `submissionId` is provided. The analysis page reads token counts from the submission record instead of the session store.

Reference: PRD Phase 2.5–2.6 and Phase 6.

#### Acceptance criteria

- [ ] `incrementTokensIn` and `incrementTokensOut` removed from `questionSessionStore`
- [ ] Analysis page no longer calls client-side token increment from analysis response
- [ ] `submitWithSession` no longer sets `tokensIn`/`tokensOut` (preserves server-tracked values)
- [ ] `handleEndQuestion` submits session data for both invite and non-invite flows
- [ ] `/api/analysis` route uses `after()` to call `incrementTokenUsage` when `submissionId` is present
- [ ] Analysis page reads token counts from the submission record
- [ ] Non-invite flow: analysis shows accurate total tokens (chat + analysis) from DB
- [ ] No client-side token increment code remains

#### User stories addressed

- Track ALL token usage (chat + analysis) server-side
- Both flows share the same token tracking code
