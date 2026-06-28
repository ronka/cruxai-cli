# Plan: Message Timestamps in Chat Timeline

> Generated from: docs/2026-04-10-message-timestamps-design.md
> Date: 2026-04-10

## Overview

Add elapsed-time timestamps (`t+Xm`) to user messages in the ChatTimeline (recruiter analysis view), showing when each message was sent relative to the assignment start. Timestamps are captured client-side from the timer store, sent to the server with each chat request, stamped onto the user message in the `chatMessages` jsonb column, and displayed in the ChatTimeline.

---

## Tasks

### Task 1: Define `StoredMessage` type and update schema

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

Create a `StoredMessage` type that extends `UIMessage` with an optional `elapsedSeconds` field. Update the Drizzle schema column type annotation for `chatMessages` to use `StoredMessage[]`. Update the `Submission` interface in `recruiter.ts` to use `StoredMessage[]` for `chatMessages`. Update imports in `submissions.ts` service to use the new type.

#### Acceptance criteria

- [ ] `StoredMessage` type defined as `UIMessage & { elapsedSeconds?: number }` in `src/types/`
- [ ] `src/server/db/schema/submissions.ts` column type updated to `StoredMessage[]`
- [ ] `src/types/recruiter.ts` `Submission.chatMessages` updated to `StoredMessage[]`
- [ ] `src/server/services/submissions.ts` imports and function signatures updated to use `StoredMessage`
- [ ] Project compiles without type errors (`npm run build`)

---

### Task 2: Client sends `elapsedSeconds` with each message

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

In `handleSendMessage` in `src/app/questions/[id]/page.tsx`, read the current `timerStore.seconds` value and include it as `elapsedSeconds` in the `sendMessage` body payload alongside existing fields (`currentFiles`, `modelId`, `sandboxId`, etc.).

#### Acceptance criteria

- [ ] `handleSendMessage` reads `timerStore.seconds` and passes `elapsedSeconds` in the `body` of `sendMessage`
- [ ] The value is the raw elapsed seconds (integer) at the moment the user sends the message

---

### Task 3: Server stamps and persists `elapsedSeconds` on user messages

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Three changes in the server path:

1. **`src/app/api/chat/route.ts`**: Extract `elapsedSeconds` from the request body. Pass it through to the `onFinish` callback so `saveChatMessages` can use it.

2. **`src/server/services/submissions.ts`**: Update `saveChatMessages` to accept an optional `elapsedSeconds` parameter. Before writing, read existing messages from the DB to preserve their `elapsedSeconds` values. Identify the newest user message (last user-role message without `elapsedSeconds`) and stamp it with the provided value. Write the merged array back.

3. **`src/server/chat.ts`**: Update `ChatFinishEvent` type if needed to carry `elapsedSeconds` through.

#### Acceptance criteria

- [ ] `/api/chat` route extracts `elapsedSeconds` from request body
- [ ] `saveChatMessages` reads existing messages from DB before writing
- [ ] Existing messages retain their `elapsedSeconds` values after save
- [ ] The new user message gets stamped with the provided `elapsedSeconds`
- [ ] Assistant messages are saved without `elapsedSeconds` (user-only feature)

---

### Task 4: ChatTimeline displays `t+Xm` from stored data

- **Type**: AFK
- **Blocked by**: Task 3

#### What to build

Update `src/components/analysis/ChatTimeline.tsx`:

1. In `convertToDisplayMessage`, read `elapsedSeconds` from the message object (via the `StoredMessage` type). Format the timestamp as `t+Xm` using `Math.floor(elapsedSeconds / 60)`.

2. When `elapsedSeconds` is not present (old submissions or assistant messages), hide the timestamp display entirely instead of showing fake data.

3. Remove the current fake timestamp logic (`index * 2` calculation) from `convertToDisplayMessage`.

#### Acceptance criteria

- [ ] User messages with `elapsedSeconds` display as `t+0m`, `t+34m`, etc.
- [ ] Messages without `elapsedSeconds` show no timestamp
- [ ] The fake `index * 2` timestamp logic is removed
- [ ] The timestamp appears in the existing slider area where the old fake timestamp was
