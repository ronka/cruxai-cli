# Background Analysis via Vercel Workflow DevKit

## Context

When a candidate completes a question via an invite link, they're redirected to a thank-you page. Analysis only runs on the client-side `/questions/[id]/analysis` page, which the invite flow never visits. Result: the recruiter's submission page shows "Analysis pending" forever, tokens are 0, and no message insights appear.

**Goal:** Trigger analysis as a durable background workflow when the candidate submits, so it runs regardless of where the candidate navigates.

---

## Phase 1: Install & Configure Workflow DevKit

### 1.1 Install packages
```bash
npm install workflow @workflow/next
```
(`@workflow/ai` not needed — we use `generateText` directly in a `"use step"` function which has full Node.js access)

### 1.2 Wrap Next.js config
**File:** `next.config.mjs`
- Import `withWorkflow` from `@workflow/next`
- Wrap the exported config: `export default withWorkflow(nextConfig)`

---

## Phase 2: Add `analyzing` Submission Status

Lets the recruiter distinguish "waiting for analysis to start" from "analysis actively running."

### 2.1 DB enum
**File:** `src/server/db/schema/enums.ts`
- Add `'analyzing'` to `submissionStatusEnum`
- Run `npm run db:generate && npm run db:migrate`

### 2.2 TypeScript type
**File:** `src/types/recruiter.ts` (line 5)
- Add `'analyzing'` to `SubmissionStatus` union

### 2.3 Zod validation
**File:** `src/server/validation/submissions.ts`
- Add `'analyzing'` to both `updateSubmissionSchema.status` (line 8) and `updateSubmissionStatusSchema.status` (line 25)

### 2.4 Timestamp mapping
**File:** `src/server/services/submissions.ts` — `updateSubmissionStatus` (line 88)
- Add `analyzing: {}` to the `timestampUpdates` record (no special timestamp)

### 2.5 Status select component
**File:** `src/components/recruiters/SubmissionStatusSelect.tsx` (line 7-11)
- Add `{ value: "analyzing", label: "Analyzing" }` to `STATUS_OPTIONS`

### 2.6 Recruiter submission page
**File:** `src/app/recruiters/submissions/[submissionId]/page.tsx` (lines 109-114)
- Add a case for `status === 'analyzing'` showing "Analysis in progress" with spinner
- Keep existing `status === 'submitted'` case showing "Analysis pending"

---

## Phase 3: Create the Analysis Workflow

### 3.1 Extract shared message/snapshot conversion utils
**New file:** `src/lib/analysisUtils.ts`

Extract from `src/hooks/question-analysis/useTriggerQuestionAnalysis.ts` (lines 28-88) into pure functions usable on both client and server:

- `extractMessageContent(message): string` — extracts text from UIMessage `parts` array
- `simplifyMessages(messages): Array<{ role: string; content: string }>`
- `snapshotsToSystemMessages(snapshots, messages): SystemMessageForAPI[]` — builds messageId→index map, converts snapshot kinds to API format

Then update `useTriggerQuestionAnalysis.ts` to import from this shared utility instead of its local copies.

### 3.2 Create the workflow function
**New file:** `src/server/workflows/analyzeSubmission.ts`

```
export default async function analyzeSubmission(submissionId: string)
```

**Step 1 — Fetch data** (`"use step"`):
- `getSubmissionById(submissionId)` — get chat messages, snapshots, timeSpent
- `getInviteById(submission.inviteId)` — get questionId
- `getQuestionById(invite.questionId)` — get title, difficulty, role
- Use `simplifyMessages()` and `snapshotsToSystemMessages()` from `src/lib/analysisUtils.ts`
- Return all data needed for analysis

**Step 2 — Run AI analysis** (`"use step"`, retryable):
- Get API key from `process.env.AI_GATEWAY_API_KEY`
- Build prompt via `getAnalysisPrompt()` (from `src/server/prompts.ts`)
- Call `generateText()` with `analysisResponseSchema` structured output (same as current `/api/analysis`)
- Use `getDefaultModel()` from `src/lib/models.ts`
- Return `{ output, usage }`

**Step 3 — Persist results** (`"use step"`):
- `saveAnalysis(submissionId, { overallScore, messageInsights })` — sets status to `reviewed`
- `updateSubmission(submissionId, { tokensIn: existing + analysis, tokensOut: existing + analysis })` — accumulate analysis token usage onto existing counts

**Reused functions (no duplication):**
- `getSubmissionById` / `saveAnalysis` / `updateSubmission` from `src/server/services/submissions.ts`
- `getInviteById` from `src/server/services/invites.ts`
- `getQuestionById` from `src/server/services/questions.ts`
- `getAnalysisPrompt` from `src/server/prompts.ts`
- `getDefaultModel` from `src/lib/models.ts`
- `analysisResponseSchema` from `src/server/analysisSchema.ts`

---

## Phase 4: Trigger Workflow from Session Submission

**File:** `src/app/api/submissions/[submissionId]/session/route.ts`

After `submitWithSession()` succeeds:
1. Guard: only trigger if `!submission.analysisResult` (prevent duplicates on re-submit)
2. `updateSubmissionStatus(submissionId, 'analyzing')`
3. `start(analyzeSubmission, [submissionId])` — fire-and-forget via `workflow/api`
4. Wrap in try/catch — log errors but don't fail the response to the client

The candidate's redirect to thank-you page happens independently on the client side.

---

## Phase 5: Preserve Non-Invite Flow

**No changes needed.** The existing `/api/analysis` route and `/questions/[id]/analysis` page continue to work as-is for the non-invite flow (direct question access without invite code). That flow uses the client's API key and runs analysis client-side.

---

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| `next.config.mjs` | Modify | 1 |
| `src/server/db/schema/enums.ts` | Modify | 2 |
| `src/types/recruiter.ts` | Modify | 2 |
| `src/server/validation/submissions.ts` | Modify | 2 |
| `src/server/services/submissions.ts` | Modify | 2 |
| `src/components/recruiters/SubmissionStatusSelect.tsx` | Modify | 2 |
| `src/app/recruiters/submissions/[submissionId]/page.tsx` | Modify | 2 |
| `src/lib/analysisUtils.ts` | **Create** | 3 |
| `src/server/workflows/analyzeSubmission.ts` | **Create** | 3 |
| `src/hooks/question-analysis/useTriggerQuestionAnalysis.ts` | Modify | 3 |
| `src/app/api/submissions/[submissionId]/session/route.ts` | Modify | 4 |

**2 new files, 9 modified files**

---

## Verification

1. **Invite flow:** Create invite → start question → send messages → click "End Question" → verify thank-you redirect → check recruiter page shows `analyzing` then `reviewed` with score and insights
2. **Non-invite flow:** Start question directly → end question → verify `/questions/[id]/analysis` still runs client-side analysis as before
3. **Edge cases:** Empty conversation, missing API key (workflow fails gracefully, status stays `analyzing`), double-submit (guard prevents duplicate workflow)
4. **Workflow inspection:** `npx workflow web` to monitor runs locally, or Vercel dashboard in production
