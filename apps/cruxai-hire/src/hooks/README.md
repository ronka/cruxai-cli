# Hooks Directory (`src/hooks`)

## Purpose
This directory contains reusable custom React hooks used across the app.  
Hooks here encapsulate side effects, form state, URL/query syncing, store hydration, and API mutation flows so page/components stay focused on rendering.

## Implementation Notes
- Hooks are grouped by feature folder (`question-detail`, `recruiter-role-detail`, `chat`, etc.).
- Many hooks coordinate Zustand stores and only initialize mock data after store hydration.
- Server mutations are handled with React Query hooks (`useMutation`) and then synced into Zustand stores.
- Shared/general hooks live at the root of `src/hooks`.

## File Inventory
| File | Function | Short implementation details |
| --- | --- | --- |
| `useAnalysis.ts` | Sends question session data to analysis API. | Defines `AnalysisInput`, posts to `/api/analysis`, and exposes `useAnalysisMutation()` with normalized error handling. |
| `useSandbox.ts` | Main sandbox client hook for create/read/write flows. | Wraps sandbox API endpoints in React Query mutations, syncs results to `sandboxStore`, and includes debug sandbox reuse/cache logic from `settingsStore`. |
| `candidate-detail/useInitializeCandidateDetail.ts` | Initializes recruiter candidate-detail page stores. | After candidates/submissions stores hydrate, loads provided mock data only when store arrays are empty. |
| `candidates-page/useInitializeCandidateStore.ts` | Initializes candidate dashboard stores. | Waits for candidate and user store hydration, then runs `initializeCandidateAssessments()` and `initializeUser()`. |
| `carousel/useCarouselControls.ts` | Provides Embla carousel control state and handlers. | Creates carousel API with orientation support, tracks `canScrollPrev/Next`, and exposes keyboard + programmatic navigation handlers. |
| `chat/useAutoScroll.ts` | Auto-scroll behavior for chat/message containers. | Tracks whether user scrolled away from bottom, auto-scrolls on dependency changes only when not interrupted, and exposes `scrollToBottom()`. |
| `chat/usePageCloseWarning.ts` | Warns before closing active chat session. | Conditionally registers `beforeunload` listener when session is active to trigger native leave-page dialog. |
| `code-editor/useCodeEditorState.ts` | Local editor state management for file editing. | Keeps `localContent` + dirty flag, resets on file/content changes, and provides `handleSave()` that no-ops when unchanged. |
| `invite-candidate/useInviteCandidateForm.ts` | Form state for inviting a candidate. | Manages fields, validates required input, validates CV file type/size, and converts selected file to data URL for submit payload. |
| `invite-landing/useInviteStart.ts` | Starts a candidate session from the invite landing page. | Updates candidate status to `started`, marks matching submission `in_progress`, then redirects to `/questions/{id}?invite={code}`. |
| `invite-page/useInviteResolution.ts` | Fetches and caches invite context for the `/invite/[code]` page. | React Query wrapper over `GET /api/invite/{code}`; returns candidate, role, question, and questionId. Stale time 5 min, no retry on error. |
| `question-page/useInviteEndQuestion.ts` | Marks a submission completed when the candidate ends an invite session. | Looks up the submission by candidate + question ID, sets status to `submitted`, and updates candidate status to `submitted`. No-ops if no invite context is present. |
| `question-page/useInviteMismatchRedirect.ts` | Redirects if the invite code resolves to a different question than the URL. | Effect-based guard: if `resolvedQuestionId !== urlQuestionId`, calls `router.replace` to the correct question URL with the invite code preserved. |
| `mobile/useIsMobile.ts` | Responsive breakpoint hook. | Uses `matchMedia`/`window.innerWidth` with a `768px` breakpoint and updates state on media query changes. |
| `question/useCheckpoints.ts` | Snapshot/checkpoint lifecycle for coding sessions. | Creates snapshots on assistant completion (`streaming -> ready`) and supports async revert with optimistic file restore + rollback on failure. |
| `question-analysis/useQuestionAnalysisHydration.ts` | Hydration state helper for analysis page. | Subscribes to `questionsStore.persist.onFinishHydration()` and returns boolean hydration readiness. |
| `question-analysis/useQuestionAnalysisNotFoundRedirect.ts` | Redirect guard for missing analysis target question. | Once hydrated, redirects to `/questions` when no matching question exists. |
| `question-analysis/useTriggerQuestionAnalysis.ts` | Triggers analysis mutation from session artifacts. | Converts AI SDK messages/snapshots to simplified API payload (`messages` + `systemMessages`) and calls mutation when eligible. |
| `question-detail/useMessageTokenSync.ts` | Syncs message array into token usage state. | Runs `updateFromMessages(messages)` via effect whenever message list changes. |
| `question-detail/useQuestionHydration.ts` | Hydration state helper for question detail page. | Same persistence-hydration pattern as analysis hook, based on `questionsStore`. |
| `question-detail/useQuestionNotFoundRedirect.ts` | Redirect guard for missing question detail route. | Once hydrated, redirects to `/questions` if requested question is not found. |
| `question-detail/useToolCallFileSync.ts` | Applies assistant tool output to local sandbox files. | Scans assistant `tool-updateCode` outputs, deduplicates by `toolCallId` via `questionStateStore`, and writes updated file content locally. |
| `questions/useCandidateQuestions.ts` | Loads candidate question list into store. | Seeds `questionsStore` from static `questions` data when store is empty, then returns store data. |
| `questions-library/useInitializeQuestionsLibrary.ts` | Initializes recruiter library page stores. | Hydration-gated loader for recruiter questions, roles, and candidates; only seeds empty stores and returns combined readiness. |
| `reasoning/useReasoningState.ts` | Tracks reasoning panel open state + duration. | Opens panel when streaming starts, records start timestamp, and computes elapsed seconds when streaming ends. |
| `recruiter-question-editor/useInitializeRecruiterQuestions.ts` | Seeds recruiter question editor question store. | Loads mock role questions into recruiter question store when empty. |
| `recruiter-question-editor/useRecruiterQuestionForm.ts` | Full form state for recruiter question create/edit. | Holds all editable question fields (repo, metrics, AI permissions, constraints) and hydrates state from existing question. |
| `recruiter-role-detail/useInitializeRoleDetail.ts` | Initializes all data dependencies for recruiter role detail. | Hydration-aware loader for recruiter questions, roles, submissions, and candidates with empty-store guards. |
| `recruiter-role-detail/useInitializeRoleQuestions.ts` | Initializes role detail question list. | Loads role question mocks into recruiter question store after hydration if store is empty. |
| `recruiters-page/useInitializeRecruiterStores.ts` | Bootstraps recruiter overview stores. | After hydration, calls store-level initialize helpers for roles, candidates, and submissions. |
| `role-form/useInitializeNewRoleQuestions.ts` | Seeds available question pool for new role form. | Loads recruiter questions after hydration when current question list is empty. |
| `role-form/useRoleForm.ts` | Form state hook for recruiter job roles. | Manages role fields + selected question IDs, exposes trimmed `getFormData()`, validity check, and reset to `initialData`. |
| `sandbox/useTestRunner.ts` | Runs tests in current sandbox and stores report/error state. | Posts `sandboxId` to `/api/sandbox/run-tests`, toggles running state in `testResultsStore`, and writes parsed Jest report on success. |
| `send-to-candidate/useSendToCandidate.ts` | Assigns question to candidate and generates invite link. | Updates candidate assignment/invite code/status, creates submission record, builds sharable invite URL (`/invite/{code}`), and supports clipboard copy. |
| `sidebar/useSidebarKeyboardShortcut.ts` | Keyboard shortcut binding for sidebar toggle. | Registers/removes `keydown` listener and triggers toggle on `Cmd/Ctrl + <shortcutKey>`. |
| `tabs/useTabSearchParam.ts` | URL query-state helper for tab selection. | Uses `nuqs` to bind `tab` query param with default value and push-history updates. |
| `toast/useToast.ts` | Global toast state and API. | Implements in-memory reducer/listener store with add/update/dismiss/remove actions, toast limit, delayed removal queue, and `useToast()` subscription. |
| `view-mode-tabs/useViewModePathInput.ts` | Local input mirror for view-mode path editing. | Keeps editable `inputPath` synced from external `currentPath` prop changes. |
