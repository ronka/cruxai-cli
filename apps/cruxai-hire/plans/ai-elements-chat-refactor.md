# Plan: AI Elements Chat Refactor

> Generated from: `docs/2026-04-09-ai-elements-chat-refactor-plan.md`
> Date: 2026-04-09

## Overview

Migrate the candidate chat UI to [`ai-elements`](https://www.npmjs.com/package/ai-elements), Vercel's shadcn-based component library for AI-native interfaces. Three independent surfaces are refactored: the chat input (`ChatInput`), the chat message panel (`ChatPanel`), and the test results panel (`TestCasesPanel`). The refactor also fixes an existing plain-text-vs-markdown bug, adds mid-stream cancellation, adds a scroll-to-bottom button, adds suite grouping for test results, and removes dead UI (mode selector, placeholder action buttons, unreachable checkpoint UI, planning indicator). No backend, schema, or API changes — all three surfaces continue to use the existing `useChat` hookup, `/api/chat` route, and session flow.

All behavior decisions were pre-resolved in a grill-me session; tasks are AFK and can be implemented without further human input. Tasks 2 and 3 are parallelizable after Task 1 completes.

---

## Tasks

### Task 1: Install ai-elements and migrate `ChatInput` to `PromptInput`

- **Type**: AFK
- **Blocked by**: None — can start immediately

#### What to build

A full rewrite of `src/components/question/ChatInput.tsx` on top of `PromptInput` from ai-elements, plus the corresponding call-site updates in `src/app/questions/[id]/page.tsx`. This slice also runs the ai-elements CLI install for **all six** components (`prompt-input`, `conversation`, `message`, `reasoning`, `tool`, `test-results`) so Tasks 2 and 3 are unblocked.

See `docs/2026-04-09-ai-elements-chat-refactor-plan.md` → "Commit 1: Migrate ChatInput to ai-elements PromptInput" for the full specification:
- `PromptInput` owns textarea state (delete local `useState`, manual `handleSubmit`, `handleKeyDown`)
- Delete the mode selector (Agent-only dead UI)
- Delete `ChatInputActions` (four non-functional action buttons)
- Replace `DropdownMenu` model selector with `PromptInputSelect`, store model id as `string` locally, cast to `LanguageModel` at the `onSend` boundary
- Preserve the `allowedModels` filter exactly as-is
- Reasoning toggle becomes a `PromptInputButton` with `Brain` icon, `variant={enableReasoning ? "default" : "ghost"}`, rendered only when `selectedModel?.supportsReasoning`
- Placeholder: `"Describe what you want to build or change"`
- Override only `min-h-[100px]` on `PromptInputTextarea`; accept all other ai-elements defaults
- Export `SendPayload` type; change `onSend` to take a single payload object
- New `ChatInput` props: `onSend(payload)`, `status`, `disabled`, `stop`, `allowedModels`
- `onSubmit` handler calls `stop()` when `status === "streaming"`, otherwise calls `onSend`
- `page.tsx` destructures `stop` from `useChat`, deletes `isChatLoading` (verify no other consumers via grep), passes `status`/`stop`/`disabled` to `ChatInput`, updates `handleSendMessage` to accept `SendPayload`

Commit message: `Migrate ChatInput to ai-elements PromptInput`

#### Acceptance criteria

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `src/components/ai-elements/` contains all six installed component files
- [ ] `ChatInput.tsx` imports from `@/components/ai-elements/prompt-input`
- [ ] Textarea accepts input; Enter submits, Shift+Enter inserts newline
- [ ] Submit button shows arrow → spinner → stop-square as `status` transitions (`ready` → `submitted` → `streaming`)
- [ ] **Cancel mid-stream via stop button works**, partial message renders, next submit works normally
- [ ] Model selector shows filtered models based on `question.aiPermissions.allowedModels`
- [ ] Brain-icon reasoning button appears only when selected model has `supportsReasoning: true` (Claude 3.7 Sonnet)
- [ ] Reasoning button toggles between `default`/`ghost` variants; payload includes `enableReasoning`
- [ ] Input is disabled when `!hasStarted`, during `isReverting`, and when `isTimedOut`
- [ ] No mode selector, no `AtSign`/`Globe`/`ImageIcon`/`Mic` buttons
- [ ] Placeholder reads `"Describe what you want to build or change"`
- [ ] Textarea has `min-h-[100px]`
- [ ] `SendPayload` type exported from `ChatInput.tsx` and imported in `page.tsx`

#### User stories addressed

- Candidates can submit prompts with a familiar chat interface
- Candidates can cancel a runaway assistant mid-stream instead of waiting for `stepCountIs(20)` to finish
- Candidates see accurate submit button states (send / in-flight / cancellable)
- Candidates no longer see dead/non-functional UI elements that promise features that don't exist

---

### Task 2: Migrate `ChatPanel` to `Conversation`/`Message`/`Reasoning`/`Tool`

- **Type**: AFK
- **Blocked by**: Task 1 (ai-elements install)

#### What to build

A full rewrite of `src/components/question/ChatPanel.tsx` to render messages via ai-elements primitives, plus deletion of now-dead files. This slice also fixes the existing plain-text-vs-markdown bug (the system prompt in `src/server/prompts.ts:11` asks for bullet points, but the current renderer shows them as literal dashes). Tasks 2 and 3 are independent — can run in parallel after Task 1.

See `docs/2026-04-09-ai-elements-chat-refactor-plan.md` → "Commit 2: Migrate ChatPanel to ai-elements components" for the full specification:
- Replace custom scroll container with `<Conversation>` / `<ConversationContent>` / `<ConversationScrollButton>`
- Empty state: `<ConversationEmptyState>` with `Sparkles` icon, `"Start chatting"` title, `"Ask the AI assistant to help you build your solution."` description
- Messages: `<Message from={role}><MessageContent>...</MessageContent></Message>`, accepting ai-elements defaults (unboxed assistant, primary-color user bubble)
- Text parts: `<MessageResponse>` for markdown rendering
- Reasoning parts: **consolidate** all reasoning parts per message into a single `<Reasoning>` block rendered before text/tool parts (canonical ai-elements pattern)
- `tool-updateCode`: wrap in `<Tool>`/`<ToolHeader>`/`<ToolContent>`/`<ToolOutput>`, skip `<ToolInput>`, pass dynamic `title` per state (`"Updating {filePath}"` / `"Updated {filePath}"` / `"Error updating {filePath}"`), feed the existing `text-diff` diff viewer into `<ToolOutput output={...}>`
- Delete `PlanningIndicator` + `showPlanningIndicator` + `isSubmitted` prop
- Delete `RevertingIndicator` (unreachable after checkpoint UI deletion)
- Delete **all** checkpoint UI: `CheckpointFooter`, `StandaloneCheckpoint`, `showCheckpointUi`, `snapshotsByMessageId`/`standaloneSnapshots` memo, `onRevert`/`isReverting`/`snapshots`/`currentSnapshotId` props
- Add a `// TODO:` comment at top of `ChatPanel.tsx` documenting the checkpoint UI removal
- Keep `useCheckpoints` data pipeline wired in `page.tsx` — snapshots still record and serialize at session end
- Keep `usePageCloseWarning(messages.length > 0)` exactly as-is

**Files deleted in this slice:**
- `src/components/question/Reasoning.tsx`
- `src/hooks/reasoning/useReasoningState.ts`
- `src/hooks/reasoning/` (empty dir)
- `src/hooks/chat/useAutoScroll.ts`
- `src/app/dev/chat-diff-verify/` (empty dir)

Commit message: `Migrate ChatPanel to ai-elements components`

#### Acceptance criteria

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Empty state renders with `Sparkles` icon, title, and description
- [ ] User bubble renders right-aligned with primary color; assistant renders unboxed (no grey bubble)
- [ ] **Markdown renders** in assistant messages — bullets, bold, code blocks (no literal `**` or `-` characters)
- [ ] Markdown also renders inside reasoning blocks (via Streamdown)
- [ ] Reasoning block appears during thinking, auto-collapses when done, manually re-expandable
- [ ] Multiple reasoning parts in a single message consolidate into one `<Reasoning>` block
- [ ] `updateCode` tool call shows "Updating {filePath}..." during streaming
- [ ] `updateCode` tool call shows "Updated {filePath}" when done with expandable diff
- [ ] Diff viewer shows insert/delete segment colors correctly
- [ ] `updateCode` tool call shows "Error updating {filePath}" in error state
- [ ] Scroll behavior: auto-follows stream at bottom; scrolling up pauses follow; `ConversationScrollButton` appears and restores follow on click
- [ ] `beforeunload` warning still fires when closing the tab with messages present
- [ ] No `PlanningIndicator`, `RevertingIndicator`, `CheckpointFooter`, or `StandaloneCheckpoint` in the codebase
- [ ] `// TODO:` comment present in `ChatPanel.tsx` documenting checkpoint UI removal
- [ ] `useCheckpoints` hook still wired in `page.tsx` — snapshots still record
- [ ] Dead files deleted: `Reasoning.tsx`, `useReasoningState.ts`, `useAutoScroll.ts`
- [ ] Empty dirs deleted: `src/hooks/reasoning/`, `src/app/dev/chat-diff-verify/`
- [ ] Session end still serializes snapshots into `sessionPayload`
- [ ] `ChatTimeline.tsx` (out of scope) still compiles and renders correctly — `ChatAgentUIMessage` type not broken

#### User stories addressed

- Candidates see properly rendered markdown in assistant responses (was broken — bullets showed as literal dashes)
- Candidates can scroll back up during a long response without being yanked back to the bottom every token
- Candidates see a scroll-to-bottom button when they've scrolled up mid-stream
- Candidates see a modern unboxed chat aesthetic (readable long responses)
- Candidates no longer see dead checkpoint/revert UI that can't be triggered

---

### Task 3: Migrate `TestCasesPanel` to `ai-elements/test-results`

- **Type**: AFK
- **Blocked by**: Task 1 (ai-elements install)

#### What to build

Rewrite the results-rendering branch of `src/components/question/preview/TestCasesPanel.tsx` to use `ai-elements/test-results` with suite grouping. Fix the misleading `'pending'` status enum and drop dead `flattenedTests` state from `testResultsStore`. Independent of Task 2 — can run in parallel.

See `docs/2026-04-09-ai-elements-chat-refactor-plan.md` → "Commit 3: Migrate TestCasesPanel to ai-elements test-results" for the full specification:
- `types/test-results.ts`: drop `'pending'` from `TestResultStatus` union
- `stores/testResultsStore.ts`: `normalizeJestStatus` maps Jest's `pending`/`todo`/`disabled` directly to `'skipped'`; delete `flattenedTests` state field; delete `flattenJestResults` helper; `setReport` only computes `summary`
- `TestCasesPanel.tsx`: read `report` from the store (not `flattenedTests`)
- Keep the panel header toolbar structure (title + Run button + `border-b`) exactly as-is
- Replace native `<button>` in header with shadcn `<Button size="sm">`, same icon + text composition
- Keep loading, error, and empty states exactly as-is
- Replace the results-rendering branch with:
  - `<TestResults summary={summary}>` top-level
  - One `<TestSuite name={testResult.name} status={testResult.status}>` per file in `report.testResults[]`
  - Inside each suite: `<Test name={assertion.title} status={mapped} duration={assertion.duration}>`
  - `<TestError>` / `<TestErrorMessage>` / `<TestErrorStack>` for failed tests
- No per-test `'running'` state — global loading spinner is sufficient

Commit message: `Migrate TestCasesPanel to ai-elements test-results`

#### Acceptance criteria

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `TestResultStatus` union no longer includes `'pending'`
- [ ] `flattenedTests` state field and `flattenJestResults` helper removed from `testResultsStore`
- [ ] `normalizeJestStatus` returns `'skipped'` for Jest's `pending`/`todo`/`disabled`
- [ ] "Run Tests" header button is now shadcn `<Button>` with same icon + text composition
- [ ] Run Tests button fires test run; loading spinner shows during run
- [ ] Results render grouped by suite (file path), each suite collapsible
- [ ] Passed tests are green, failed are red, skipped are yellow
- [ ] Failed tests expand to show error message + stack
- [ ] Empty state ("No test results yet") still renders before first run
- [ ] Error state still renders on run failure
- [ ] Header toolbar structure (title + Run button + `border-b`) unchanged
- [ ] `page.tsx` still reads `testResultsSummary` from the store correctly for session submission

#### User stories addressed

- Candidates can triage test failures faster by collapsing passing suites and focusing on failing files
- Candidates see file-level grouping for multi-file test runs instead of a flat wall of tests
- Codebase no longer carries dead `flattenedTests` state or a misleading `'pending'` status value

---

## Post-merge verification

After all three tasks land, run the full-flow smoke checks from `docs/2026-04-09-ai-elements-chat-refactor-plan.md` → "Full-flow smoke" and "Regression watch":

- Non-invite flow: start question → chat → run tests → end question → analysis route loads
- Invite flow: click invite URL → auto-start → chat → end question → thank-you page
- Refresh mid-session: `useInviteSessionRestore` restores chat history into the new `Conversation`
- `useMessageTokenSync` still fires — token counts update
- `useToolCallFileSync` still fires — `updateCode` outputs still sync to sandbox
- `ChatTimeline.tsx` analysis view still renders correctly
