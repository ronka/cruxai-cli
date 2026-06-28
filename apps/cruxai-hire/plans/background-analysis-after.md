# Background Analysis & Server-Side Token Tracking via Next.js `after()`

## Context

Three problems across both flows:

1. **Analysis never runs (invite flow):** When a candidate completes a question via an invite link, they're redirected to a thank-you page. Analysis only runs on the client-side `/questions/[id]/analysis` page, which the invite flow never visits. Result: the recruiter's submission page shows "Analysis pending" forever with no score or insights.

2. **Token counts are always 0 (both flows):** `createAgentUIStreamResponse` doesn't expose usage data to the client. The `incrementTokensIn`/`incrementTokensOut` calls only happen on the analysis page and only capture analysis tokens — chat tokens are never tracked. So `tokensIn`/`tokensOut` are always 0 or only reflect the analysis call.

3. **No submission record (non-invite flow):** The non-invite flow has no submission to store tokens against. The `submissions` table requires a `NOT NULL inviteId`, so non-invite sessions can't create one.

**Goals:**
- Track ALL token usage (chat + analysis) server-side, persisted to a submission in the DB
- Both flows create a submission and share the same token tracking code
- Trigger analysis as a background task when the candidate submits (invite flow)

**Approach:** Use Next.js `after()` (from `next/server`) for token tracking and background analysis. `after()` schedules work to run after the response is sent. On Vercel, it's backed by `waitUntil`, so the function stays alive. No new dependencies needed. Unify the data model so both flows create a submission and pass `submissionId` to the chat route.

---

## Phase 1: Unify Submission Model for Both Flows

Both flows need a submission to track tokens against. Currently only the invite flow creates one.

### 1.1 Make `inviteId` nullable, add `questionId`

**File:** `src/server/db/schema/submissions.ts`

```diff
- inviteId: uuid('invite_id').notNull().references(() => invites.id, { onDelete: 'cascade' }),
+ inviteId: uuid('invite_id').references(() => invites.id, { onDelete: 'cascade' }),
+ questionId: uuid('question_id').references(() => questions.id, { onDelete: 'cascade' }),
```

- `inviteId` becomes nullable (invite flow sets it, non-invite flow leaves it null)
- `questionId` added as a direct reference (both flows set it — invite flow can derive it from invite, but having it directly is cleaner)
- Run `npm run db:generate && npm run db:migrate`

### 1.2 Update `createSubmission` to support both flows

**File:** `src/server/services/submissions.ts`

```ts
export async function createSubmission(data: {
  inviteId?: string;
  questionId: string;
}): Promise<Submission> {
  const rows = await db.insert(schema.submissions).values({
    inviteId: data.inviteId ?? null,
    questionId: data.questionId,
    status: 'in_progress',
    startedAt: new Date(),
  }).returning();
  return toSubmission(rows[0]);
}
```

### 1.3 Update validation schema

**File:** `src/server/validation/submissions.ts`

```ts
export const createSubmissionSchema = z.object({
  inviteId: z.string().uuid().optional(),
  questionId: z.string().uuid(),
});
```

### 1.4 Update `Submission` type

**File:** `src/types/recruiter.ts`

- Add `questionId: string` to `Submission` interface

**File:** `src/server/services/submissions.ts` — `toSubmission()`

- Map `row.questionId` to the return object

### 1.5 Create submission on question start (non-invite flow)

**File:** `src/app/questions/[id]/page.tsx`

When the candidate clicks "Start" (inside the handler that calls `initSession`):

```ts
// After initSession(resolved.question.id)
if (!inviteCode) {
  const submission = await createSubmission({ questionId: resolved.question.id });
  setSubmissionId(submission.id);
}
```

The `submissionId` is stored in `questionSessionStore` (already has this field). For the invite flow, `useInviteStart` already creates the submission — just update it to also set `submissionId` in the store.

### 1.6 Update invite flow to pass `questionId` and store `submissionId`

**File:** `src/hooks/invite-landing/useInviteStart.ts`

Update `createSubmission` call to include `questionId`:

```ts
const submission = await createSubmission({ inviteId: invite.id, questionId });
```

Store the submission ID in the session store so the question page can pass it to the chat route:

```ts
// After createSubmission or finding existing submission
setSubmissionId(submission.id ?? existing.id);
```

### 1.7 Update submissions API route

**File:** `src/app/api/submissions/route.ts`

The `POST` handler uses `createSubmissionSchema` — the schema change in 1.3 handles this.

---

## Phase 2: Server-Side Token Tracking (Both Flows)

Track token usage on the server after each chat message, using `after()` so it doesn't block the streaming response. Same code path for both flows.

### 2.1 Add `incrementTokenUsage` service function

**File:** `src/server/services/submissions.ts`

```ts
export async function incrementTokenUsage(
  id: string,
  tokensIn: number,
  tokensOut: number
): Promise<void> {
  await db.update(schema.submissions)
    .set({
      tokensIn: sql`COALESCE(${schema.submissions.tokensIn}, 0) + ${tokensIn}`,
      tokensOut: sql`COALESCE(${schema.submissions.tokensOut}, 0) + ${tokensOut}`,
      updatedAt: new Date(),
    })
    .where(eq(schema.submissions.id, id));
}
```

Uses SQL `COALESCE` + addition for atomic increments — safe for concurrent chat messages.

### 2.2 Restructure chat handler to capture usage

**File:** `src/server/chat.ts`

The current `handleChatRequest` uses `createAgentUIStreamResponse()` which returns a `Response` directly, with no way to capture usage. Restructure to:

1. Run the agent stream manually (use `agent.stream()` + `toUIMessageStreamResponse()`)
2. Accept an optional `onFinish` callback that receives `{ usage: { inputTokens, outputTokens } }`
3. Return the streaming response as before — no change to the client

```ts
export async function handleChatRequest(
  messages: UIMessage[],
  currentFiles: Record<string, string>,
  clientApiKey?: string,
  modelId?: LanguageModel,
  sandboxId?: string,
  enableReasoning?: boolean,
  onFinish?: (event: { usage: { inputTokens: number; outputTokens: number } }) => void
) {
  // ... existing setup (gateway, model, agent creation) ...

  const result = agent.stream({ messages });

  // Capture usage when stream finishes (non-blocking)
  if (onFinish) {
    result.consumeStream().then(() => {
      const usage = result.usage;
      onFinish({ usage: { inputTokens: usage.inputTokens ?? 0, outputTokens: usage.outputTokens ?? 0 } });
    }).catch(() => {/* best effort */});
  }

  return result.toUIMessageStreamResponse();
}
```

> **Note:** The exact API for capturing usage from the agent stream needs to be verified against the AI SDK v6 docs at implementation time. The key requirement is: get `inputTokens`/`outputTokens` after the stream completes without blocking the response.

### 2.3 Update chat route to persist tokens via `after()`

**File:** `src/app/api/chat/route.ts`

The client passes `submissionId` (from `questionSessionStore`). When present, update tokens after the response is sent:

```ts
import { after } from 'next/server';
import { incrementTokenUsage } from '@/server/services/submissions';

export async function POST(request: Request) {
  const { messages, currentFiles, apiKey, modelId, sandboxId, enableReasoning, questionId, inviteCode, submissionId } = await request.json();

  // ... existing validation & model permission check ...

  return await handleChatRequest(
    messages, currentFiles, apiKey, modelId, sandboxId, enableReasoning,
    submissionId ? (event) => {
      after(() => incrementTokenUsage(submissionId, event.usage.inputTokens, event.usage.outputTokens));
    } : undefined
  );
}
```

**Flow (both flows):** Client sends chat message with `submissionId` → server streams response → after stream completes, `after()` fires → atomic SQL increment of `tokensIn`/`tokensOut` on the submission row.

### 2.4 Pass `submissionId` from client to chat route

**File:** `src/app/questions/[id]/page.tsx` (or wherever `useChat` is configured)

Add `submissionId` from `questionSessionStore` to the chat request body. The exact location depends on how `useChat`'s transport is configured — likely in the request body or headers passed to the API.

### 2.5 Remove client-side token tracking

**File:** `src/app/questions/[id]/page.tsx`

- Remove `tokensIn`/`tokensOut` selectors from `questionSessionStore` in `handleEndQuestion`
- `submitWithSession()` no longer needs to pass token counts — DB already has accurate values

**File:** `src/app/questions/[id]/analysis/page.tsx`

- Remove the `useEffect` that calls `incrementTokensIn`/`incrementTokensOut` from analysis response (lines 70-76)
- The analysis page can read token counts from the submission record instead

**File:** `src/server/services/submissions.ts` — `submitWithSession()`

- Stop setting `tokensIn`/`tokensOut` — preserves the server-tracked values already in the DB

**File:** `src/stores/questionSessionStore.ts`

- Remove `incrementTokensIn` and `incrementTokensOut` actions (no longer used)
- Keep `tokensIn`/`tokensOut` state fields if needed for display, but they're now read from the submission

### 2.6 Update non-invite end-question to also submit session

**File:** `src/app/questions/[id]/page.tsx` — `handleEndQuestion`

Currently `markCompleted()` is a no-op for non-invite flow. Update so both flows persist session data:

```ts
// Both flows: submit session data to the submission
const submissionId = useQuestionSessionStore.getState().submissionId;
if (submissionId) {
  await submitSession(submissionId, {
    chatMessages: messages,
    snapshots,
    initialFiles,
    finalFiles: files,
    timeSpent: elapsedFormatted,
    timeExceeded: isTimedOut,
    messageCount,
  });
}

// Invite flow: redirect to thank-you
if (inviteCode) {
  router.push(`/invite/${inviteCode}/thank-you`);
} else {
  router.push(`/questions/${resolved.question.id}/analysis`);
}
```

This replaces the current split where invite flow calls `markCompleted()` and non-invite flow skips it.

---

## Phase 3: Add `analyzing` Submission Status

Lets the recruiter distinguish "waiting for analysis to start" from "analysis actively running."

### 3.1 DB enum

**File:** `src/server/db/schema/enums.ts`

- Add `'analyzing'` to `submissionStatusEnum`
- Run `npm run db:generate && npm run db:migrate`

### 3.2 TypeScript type

**File:** `src/types/recruiter.ts` (line 5)

- Add `'analyzing'` to `SubmissionStatus` union

### 3.3 Zod validation

**File:** `src/server/validation/submissions.ts`

- Add `'analyzing'` to `updateSubmissionSchema.status` enum (line 8)
- Add `'analyzing'` to `updateSubmissionStatusSchema.status` enum (line 25)

### 3.4 Timestamp mapping

**File:** `src/server/services/submissions.ts` — `updateSubmissionStatus` (~line 88)

- Add `analyzing: {}` to the `timestampUpdates` record (no special timestamp needed)

### 3.5 Status select component

**File:** `src/components/recruiters/SubmissionStatusSelect.tsx` (line 7-11)

- Add `{ value: "analyzing", label: "Analyzing" }` to `STATUS_OPTIONS`

### 3.6 Recruiter submission page

**File:** `src/app/recruiters/submissions/[submissionId]/page.tsx` (~line 109)

- Add a case for `status === 'analyzing'` showing "Analysis in progress" with spinner
- Keep existing `submitted`/`reviewed` cases as-is

---

## Phase 4: Create Server-Side Analysis Runner

### 4.1 Extract shared message/snapshot utils

**New file:** `src/lib/analysisUtils.ts`

Extract from `src/hooks/question-analysis/useTriggerQuestionAnalysis.ts` (lines 28-88) into pure functions:

- `extractMessageContent(message): string` — extracts text from UIMessage `parts` array
- `simplifyMessages(messages): Array<{ role: string; content: string }>`
- `snapshotsToSystemMessages(snapshots, messages): SystemMessageForAPI[]` — builds messageId→index map, converts snapshot kinds to API format

Then update `useTriggerQuestionAnalysis.ts` to import from this shared module.

### 4.2 Create the background analysis function

**New file:** `src/server/runBackgroundAnalysis.ts`

```ts
export async function runBackgroundAnalysis(submissionId: string): Promise<void>
```

This is a plain async function (not a workflow), called inside `after()`:

1. **Fetch data:**
   - `getSubmissionById(submissionId)` — get chat messages, snapshots, timeSpent
   - `getInviteById(submission.inviteId)` — get questionId
   - `getQuestionById(invite.questionId)` — get title, difficulty, role
   - Use `simplifyMessages()` and `snapshotsToSystemMessages()` from `src/lib/analysisUtils.ts`
2. **Set status:**
   - `updateSubmissionStatus(submissionId, 'analyzing')`
3. **Run AI analysis:**
   - Get API key from `process.env.AI_GATEWAY_API_KEY`
   - Build prompt via `getAnalysisPrompt()` (from `src/server/prompts.ts`)
   - Call `generateText()` with `analysisResponseSchema` structured output
   - Use `getDefaultModel()` from `src/lib/models.ts`
4. **Persist results:**
   - `saveAnalysis(submissionId, { overallScore, messageInsights })` — sets status to `reviewed`
   - `incrementTokenUsage(submissionId, usage.inputTokens, usage.outputTokens)` — adds analysis tokens on top of chat tokens already in the DB
5. **Error handling:**
   - Wrap in try/catch — log errors but don't throw (there's no caller to catch it)
   - On failure, status stays `analyzing` — recruiter can manually re-trigger or investigate

**Reused functions (no duplication):**

- `getSubmissionById` / `saveAnalysis` / `incrementTokenUsage` / `updateSubmissionStatus` from `src/server/services/submissions.ts`
- `getInviteById` from `src/server/services/invites.ts`
- `getQuestionById` from `src/server/services/questions.ts`
- `getAnalysisPrompt` from `src/server/prompts.ts`
- `getDefaultModel` from `src/lib/models.ts`
- `analysisResponseSchema` from `src/server/analysisSchema.ts`

---

## Phase 5: Trigger Background Analysis from Session Submission

**File:** `src/app/api/submissions/[submissionId]/session/route.ts`

```ts
import { after } from 'next/server';
import { runBackgroundAnalysis } from '@/server/runBackgroundAnalysis';
```

After `submitWithSession()` succeeds:

1. Guard: only trigger if `!submission.analysisResult` (prevent duplicates on re-submit)
2. `after(() => runBackgroundAnalysis(submissionId))` — fire-and-forget
3. Return the response immediately — the candidate sees no delay

The `after()` callback runs after the response is sent. On Vercel, it's backed by `waitUntil` so the function stays alive until the analysis completes.

---

## Phase 6: Non-Invite Analysis Flow

The non-invite flow now has a submission with accurate token counts. The existing `/api/analysis` route and `/questions/[id]/analysis` page continue to work for client-side analysis. The only change: the analysis page reads token counts from the submission (server-tracked) instead of from `questionSessionStore` (client-tracked).

**File:** `src/app/questions/[id]/analysis/page.tsx`

- Remove `incrementTokensIn`/`incrementTokensOut` usage
- If `submissionId` is available in the session store, fetch submission to display token counts
- The analysis API response's `usage` is still used for the analysis call's tokens — but now `incrementTokenUsage` is called server-side via `after()` in the `/api/analysis` route too

**File:** `src/app/api/analysis/route.ts`

- When `submissionId` is provided, use `after()` to call `incrementTokenUsage(submissionId, usage.inputTokens, usage.outputTokens)` — tracks analysis tokens server-side alongside chat tokens
- Remove the client-side usage return (or keep it for display, but it's no longer the source of truth)

---

## File Change Summary

| File                                                        | Action     | Phase |
| ----------------------------------------------------------- | ---------- | ----- |
| `src/server/db/schema/submissions.ts`                       | Modify     | 1     |
| `src/server/services/submissions.ts`                        | Modify     | 1, 2  |
| `src/server/validation/submissions.ts`                      | Modify     | 1, 3  |
| `src/types/recruiter.ts`                                    | Modify     | 1, 3  |
| `src/hooks/invite-landing/useInviteStart.ts`                | Modify     | 1     |
| `src/app/api/submissions/route.ts`                          | Modify     | 1     |
| `src/server/chat.ts`                                        | Modify     | 2     |
| `src/app/api/chat/route.ts`                                 | Modify     | 2     |
| `src/app/questions/[id]/page.tsx`                            | Modify     | 1, 2  |
| `src/stores/questionSessionStore.ts`                         | Modify     | 2     |
| `src/server/db/schema/enums.ts`                              | Modify     | 3     |
| `src/components/recruiters/SubmissionStatusSelect.tsx`       | Modify     | 3     |
| `src/app/recruiters/submissions/[submissionId]/page.tsx`     | Modify     | 3     |
| `src/lib/analysisUtils.ts`                                   | **Create** | 4     |
| `src/server/runBackgroundAnalysis.ts`                        | **Create** | 4     |
| `src/hooks/question-analysis/useTriggerQuestionAnalysis.ts`  | Modify     | 4     |
| `src/app/api/submissions/[submissionId]/session/route.ts`    | Modify     | 5     |
| `src/app/questions/[id]/analysis/page.tsx`                   | Modify     | 6     |
| `src/app/api/analysis/route.ts`                              | Modify     | 6     |

**2 new files, 17 modified files** — no new dependencies

---

## Why `after()` Over Workflow DevKit

| Concern               | `after()`                                        | Workflow DevKit                                                       |
| --------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| Dependencies          | None (built into Next.js)                        | `workflow`, `@workflow/next`                                          |
| Config changes        | None                                             | Wrap `next.config.mjs` with `withWorkflow`                            |
| Complexity            | Single async function                            | Directives (`"use workflow"`, `"use step"`), sandbox constraints      |
| Durability            | None — if the function crashes, analysis is lost | Full — survives crashes, retries automatically                        |
| Observability         | Server logs only                                 | Step-level dashboard via `npx workflow web`                           |
| Fit for this use case | A single AI call that takes ~10-30s              | Better suited for multi-step, long-running, or pause/resume workflows |

**Trade-off:** If the serverless function crashes mid-analysis (rare), the status stays `analyzing` and the recruiter would need to manually re-trigger. For a single AI call that takes 10-30 seconds, this risk is acceptable. If reliability becomes a concern later, migrating to Workflow DevKit is straightforward — the `runBackgroundAnalysis` function body maps directly to workflow steps.

---

## Verification

1. **Token tracking (both flows):** Send chat messages → check DB shows incrementing `tokensIn`/`tokensOut` on the submission after each message
2. **Invite flow:** Create invite → start question → send messages → click "End Question" → verify thank-you redirect → check recruiter page shows `analyzing` then `reviewed` with score, insights, and accurate token counts (chat + analysis)
3. **Non-invite flow:** Start question directly → send messages → end question → verify `/questions/[id]/analysis` shows analysis AND accurate total token counts (chat + analysis) from the submission
4. **Submission creation:** Verify non-invite flow creates a submission on question start; invite flow still creates via `useInviteStart`
5. **Edge cases:** Empty conversation (analysis should still run), missing `AI_GATEWAY_API_KEY` (logs error, status stays `analyzing`), double-submit (guard prevents duplicate analysis), concurrent chat messages (atomic SQL increment handles safely)
6. **Vercel deployment:** Confirm `after()` keeps the function alive long enough for the AI call to complete (Vercel's `waitUntil` supports up to 300s by default)

