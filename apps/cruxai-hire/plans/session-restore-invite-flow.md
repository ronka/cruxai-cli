# Plan: Session Restoration on Page Reload (Invite Flow)

> Generated from: docs/2026-04-08-session-restore-design.md
> Date: 2026-04-08

## Overview

Enable candidates in the invite flow to restore their in-progress session after a page reload. The server-side `submissions` table is the single source of truth. On reload with `?invite=xyz`, the client fetches the existing submission, reconnects to the sandbox, and hydrates all stores (chat, timer, snapshots, tool calls) so the candidate can continue where they left off.

---

## Tasks

### Task 1: Persist sandbox_id on session start

- **Type**: AFK
- **Blocked by**: None — can start immediately

#### What to build

Add a `sandbox_id` column to the `submissions` table and persist it immediately after sandbox creation succeeds during `handleStart`. This is the foundational data needed for all restore logic.

**Schema**: Add a nullable `sandbox_id` text column to `src/server/db/schema/submissions.ts`.

**Migration**: Generate and run a Drizzle migration adding the column.

**Service**: Expose a way to save `sandboxId` on an existing submission in `src/server/services/submissions.ts` (either extend `updateSubmission` or add a dedicated helper).

**Question page**: In `src/app/questions/[id]/page.tsx`, after `createSandbox` succeeds in `handleStart`, call the submissions API to persist the `sandboxId` on the submission row.

#### Acceptance criteria

- [x] `submissions` table has a `sandbox_id` text column (nullable)
- [x] Drizzle migration runs cleanly
- [x] After starting a session via invite flow, the submission row in the DB has a non-null `sandbox_id`
- [x] Existing submissions without a sandbox_id are unaffected (column is nullable)

#### User stories addressed

- Foundation for all restore logic — no user-facing behavior change yet

---

### Task 2: Restore API endpoint

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Create a dedicated `GET /api/invites/[code]/session` endpoint that returns all data needed to restore a session. This endpoint looks up the invite by code, finds the associated submission, and returns the restore payload.

**Route**: `src/app/api/invites/[code]/session/route.ts`

**Response shape** (per design doc):
```ts
{
  submissionId: string;
  chatMessages: UIMessage[];
  sandboxId: string;
  startedAt: string; // ISO timestamp
  snapshots: TimelineSnapshotSerialized[];
  status: string;
}
```

**Behavior**:
- If no invite found for code → 404
- If no submission with `status: 'in_progress'` → `{ status: 'none' }` (or 404)
- If in-progress submission exists → return full restore payload
- No auth guard needed (invite code is the access token)

**Client helper**: Add a `fetchSession(inviteCode)` function in `src/lib/api/` for the client to call this endpoint.

#### Acceptance criteria

- [x] `GET /api/invites/[code]/session` returns restore payload for an in-progress submission
- [x] Returns appropriate response when no in-progress submission exists
- [x] Returns 404 for invalid invite codes
- [x] Client-side API helper exists and is typed

#### User stories addressed

- Provides the data layer for session restoration

---

### Task 3: Store & hook restore capabilities

- **Type**: AFK
- **Blocked by**: None — can start immediately (parallel with Tasks 1 & 2)

#### What to build

Add restore/hydration entry points to the timer store, question state store, and sandbox hook so they can be initialized from server-side restore data.

**Timer store** (`src/stores/timerStore.ts`):
- Add a method (e.g., `initializeWithElapsed(elapsedSeconds, limitSeconds?, hardStop?)`) that sets `seconds` to the given elapsed value and starts the timer from there. Per the design doc, elapsed time = `Math.floor((Date.now() - startedAt) / 1000)`.

**Question state store** (`src/stores/questionStateStore.ts`):
- Add a method (e.g., `hydrate({ snapshots, processedToolCalls })`) that sets `snapshots` from the restore payload and pre-populates `processedToolCalls` with all tool call IDs extracted from restored chat messages. Also sets `hasStarted: true` and `showModal: false`.

**Sandbox hook** (`src/hooks/useSandbox.ts`):
- Add a `reconnectSandbox(sandboxId)` mutation that connects to an existing sandbox by ID (using `Sandbox.connect(sandboxId)` from the Vercel SDK), retrieves the URL via `.domain(3000)`, reads files, and saves everything to `sandboxStore`. If the sandbox has expired, throw/return an error so the caller can show the expiry message.

#### Acceptance criteria

- [x] `timerStore.initializeWithElapsed(seconds)` starts the timer from the given offset
- [x] `questionStateStore.hydrate(data)` populates snapshots, processedToolCalls, hasStarted, showModal
- [x] `useSandbox.reconnectSandbox(sandboxId)` connects to an existing sandbox, reads files, updates sandboxStore
- [x] Sandbox reconnect surfaces expiry errors cleanly (does not silently fail)

#### User stories addressed

- Enables the question page to restore each piece of state from server data

---

### Task 4: Page restore orchestration

- **Type**: AFK
- **Blocked by**: Tasks 2, 3

#### What to build

Wire up the question page (`src/app/questions/[id]/page.tsx`) to detect an in-progress session on load and restore it, following the flow from the design doc:

1. On page load with `?invite=xyz`, call `GET /api/invites/[code]/session`.
2. If an in-progress submission is returned:
   - Show a **"Restoring your session..."** loading screen (replaces the spec modal).
   - Compute elapsed timer: `Math.floor((Date.now() - startedAt) / 1000)`.
   - Call `reconnectSandbox(sandboxId)` — if sandbox expired, show an error screen ("Session expired").
   - Seed `useChat` with `initialMessages` from saved `chatMessages`.
   - Call `questionStateStore.hydrate()` with snapshots and derived `processedToolCalls` (extract all tool call IDs from restored messages).
   - Call `timerStore.initializeWithElapsed(elapsedSeconds)`.
   - Set `hasStarted: true`, `showModal: false`.
   - Dismiss loading screen — candidate resumes.
3. If no in-progress submission → proceed with normal fresh start flow (no behavior change).

**Loading UI**: Add a simple restore loading state (can be a centered spinner with "Restoring your session..." text). This replaces the modal during restore.

**Error UI**: Add an error state for sandbox expiry ("Your session has expired"). This should be a dead-end — no retry, no fresh start.

**processedToolCalls derivation**: Iterate over restored `chatMessages`, find all messages with tool calls, extract their IDs, and pass them to `questionStateStore.hydrate()` to prevent `useToolCallFileSync` from re-applying already-applied file changes.

#### Acceptance criteria

- [x] Refreshing the page during an in-progress invite session restores chat messages, timer, sandbox, and snapshots
- [x] "Restoring your session..." loading screen appears during restore
- [x] Timer resumes from correct elapsed time (wall-clock based)
- [x] Sandbox files and URL are available after restore (code editor works)
- [x] Chat history is visible and scrollable after restore
- [x] Tool calls from restored messages are not re-processed
- [x] Expired sandbox shows "Session expired" error screen
- [x] Fresh start flow (no existing submission) is unaffected
- [x] Non-invite flows are completely unaffected

#### User stories addressed

- Full session restoration on page reload for invite flow candidates
