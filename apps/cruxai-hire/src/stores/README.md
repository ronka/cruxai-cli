# Stores (`src/stores`)

This directory contains the app's client-side Zustand stores. Each file owns one state domain (single responsibility) and exposes:

- state fields
- derived getters/selectors
- mutation actions
- a `reset()` method (for lifecycle cleanup/navigation)

Most stores that represent user/session data use `zustand/middleware/persist` with `createJSONStorage` (`localStorage` or `sessionStorage`), while transient UI/runtime stores stay in-memory only.

## File Index

1. `questionsStore.ts`
   Unified question store for all questions (candidate-facing and recruiter-managed). Persists question data to `localStorage`, keeps `selectedQuestionId` and `_hasHydrated` in memory, supports full CRUD + filter helpers, question duplication, and URL-based import.

2. `candidateStore.ts`
   Candidate assessment progress store. Persists assessments, tracks status transitions (`not_started`/`in_progress`/`submitted`/`reviewed`), computes dashboard metrics (counts, average score), and timestamps start/submit events.

3. `questionSessionStore.ts`
   Per-question session history store. Persists to `sessionStorage` and tracks token usage, messages, snapshots, initial/final file state, elapsed time string, and test summary for a question run.

4. `questionStateStore.ts`
   In-memory UI state for the question workspace. Controls modal/start flags, deduplicates processed tool-call IDs via `Set`, and manages timeline snapshots with generated IDs + human-readable timestamps.

5. `recruiterCandidatesStore.ts`
   Recruiter candidate pipeline store. Persists candidates, provides lookup/filter utilities (by role/status/invite code), computes per-status counts, and stamps lifecycle dates when statuses advance.

6. `recruiterRolesStore.ts`
   Recruiter role management store. Persists role records, provides aggregate metrics (open roles, candidate totals, pending reviews), and manages role-to-question attachment via `questionIds`.

7. `recruiterSubmissionsStore.ts`
   Submission tracking store for recruiter flows. Persists submissions, supports role/candidate filters, handles status updates, and sets `submittedAt` when a submission first becomes submitted.

8. `sandboxStore.ts`
   Ephemeral code-sandbox runtime store. Keeps sandbox identifiers/URL, editable file map, original file snapshot (`initialFiles`), and a `previewKey` counter used to trigger preview refreshes.

9. `settingsStore.ts`
   Global app settings store. Persists Vercel AI Gateway API key plus debug-mode sandbox cache, exposes validation/helper actions, and includes `getStoredApiKey()` for non-React consumers.

10. `testResultsStore.ts`
    Test execution result store. Converts Jest reports into flattened test rows, normalizes statuses, computes summary stats (pass/fail/skip/duration), tracks run state/errors, and records `lastRunAt`.

11. `timerStore.ts`
    In-memory stopwatch store. Uses `setInterval` to tick every second, supports start/pause/reset, and formats elapsed time as `MM:SS` or `HH:MM:SS`.

12. `userStore.ts`
    Current candidate-user identity store. Persists a single `MockUser`, exposes set/clear/reset actions, hydration tracking, and a one-time initialization helper.
