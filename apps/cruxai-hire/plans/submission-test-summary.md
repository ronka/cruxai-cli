# Plan: Submission Test Summary (Passed / Total)

> Generated from: conversation (grilling session 2026-05-14)
> Date: 2026-05-14

## Overview

Show "passed / total" jest counts in the submission analysis stats card. The data is produced by running `npx jest --json` in the candidate's sandbox after they submit. The run is triggered server-side via `after()` in the invite-flow submit mutation, mirroring the existing background analysis pattern, and persisted to a new column on the `submissions` row. Only the recruiter view consumes the new data path; the non-invite candidate flow (which already populates `testSummary` from sessionStorage via the manual "Run Tests" panel) is untouched. If the run fails or the sandbox is dead, the column stays null and the card renders "—".

Decisions made during grilling:

- **Visible on:** recruiter view only (invite candidates skip the analysis page; non-invite path keeps existing sessionStorage wiring).
- **Trigger location:** server-side via `after()`. Survives candidate tab close.
- **Submit paths covered:** invite (`submitSessionBackground`) only. `submitSession` is untouched.
- **Persisted shape:** minimal `{ passed: number; total: number }`. Richer per-test detail is out of scope.
- **In-progress UX:** bare "—" if missing. No pending state, no polling, no status field.
- **Analysis coupling:** tests and analysis run as independent parallel `after()` calls. The LLM analysis prompt does not consume test results in this plan.

---

## Tasks

### Task 1: Read path — schema + recruiter UI surfaces `testSummary`

Status: done

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

A vertical slice that adds the `test_summary` column to the `submissions` table, exposes it through the existing service/router layer, and wires the recruiter submission analysis page to render it via the existing `<AnalysisView>` Tests stat card. No write path yet — the column is populated by hand during verification.

Specifically:

- Add `testSummary: jsonb('test_summary').$type<TestSummary | null>()` to `src/server/db/schema/submissions.ts`. Generate and apply the Drizzle migration. Nullable, no default; existing rows remain null.
- Promote the inline `TestSummary` interface in `src/components/analysis/AnalysisView.tsx:16-19` to `src/types/test-results.ts` as a new exported type (`{ passed: number; total: number }`). Distinct from the existing richer `TestResultSummary` which stays for the in-session Run Tests panel.
- Update `toSubmission` in `src/server/services/submissions.ts` to expose `testSummary` on the returned `Submission`. Update the `Submission` type in `src/types/recruiter.ts` accordingly.
- In `src/app/recruiters/submissions/[submissionId]/page.tsx`, pass `testSummary={submission.testSummary}` to `<AnalysisView>`. No other UI changes — the "—" fallback is already in place.

#### Acceptance criteria

- [ ] Drizzle migration generated and applied; `submissions.test_summary` column exists in DB as nullable jsonb.
- [ ] `TestSummary` exported from `src/types/test-results.ts`; `AnalysisView` imports from there with no local interface.
- [ ] Manually setting `UPDATE submissions SET test_summary = '{"passed":3,"total":5}' WHERE id = '<id>';` causes the recruiter page for that submission to render "3 / 5" in the Tests stat card.
- [ ] Submissions with `test_summary IS NULL` render "—" (existing behavior preserved).
- [ ] `npm run lint` passes.

#### User stories addressed

- Recruiter sees test pass count on a submission's analysis page (read path only).

---

### Task 2: Write path — auto-run jest in background on invite submit

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

A vertical slice that runs jest in the candidate's sandbox automatically after an invite-flow submission, persists `{ passed, total }` to the submission row, and surfaces it on the recruiter view (already wired in Task 1). Mirrors the existing `runBackgroundAnalysis` pattern.

Specifically:

- New file `src/server/runBackgroundTests.ts`:
  - Read submission by id; bail if missing or `sandboxId == null`.
  - `Sandbox.get(sandboxId)` inside a try/catch; if `status` is `stopped`/`stopping`/`failed`, bail.
  - `sandbox.runCommand({ cmd: 'npx', args: ['jest', '--json'], cwd: SANDBOX_ROOT })`.
  - Slice stdout from the first `{`, `JSON.parse` as `JestReport`.
  - Persist via `saveTestSummary(submissionId, { passed: report.numPassedTests, total: report.numTotalTests })`.
  - All errors → `console.error` + `Sentry.captureException`; leave column null.
- Add `saveTestSummary(id: string, summary: TestSummary): Promise<void>` to `src/server/services/submissions.ts`. Updates only `test_summary` and `updatedAt`.
- In `src/server/trpc/routers/submissions.ts`, inside `submitSessionBackground`, add `after(() => runBackgroundTests(input.id))` alongside the existing `after(() => runBackgroundAnalysis(input.id))`. Independent, parallel; no ordering.
- `submitSession` (non-invite) remains untouched.

#### Acceptance criteria

- [ ] Completing an invite-flow question end-to-end (with a sandbox repo that contains a passing jest test suite) results in `submissions.test_summary` being populated in the DB within ~1 minute of submit.
- [ ] The recruiter page for that submission renders the correct "X / Y" once the column is populated.
- [ ] When the sandbox is expired or unreachable, `test_summary` remains null, no exceptions bubble up to the client, and the recruiter page still renders "—".
- [ ] When jest output cannot be parsed (e.g. crash before JSON, no `{` in stdout), `test_summary` remains null and the failure is logged to Sentry.
- [ ] The candidate's submit response is not blocked by the test run (submit returns immediately; tests run via `after()`).
- [ ] Non-invite submissions are unaffected — their `test_summary` remains null and the existing sessionStorage path on `/questions/[id]/analysis` continues to render the candidate's manual Run Tests result.
- [ ] `npm run lint` passes.

#### User stories addressed

- Tests are run automatically when a candidate submits via an invite, without blocking the submit response.
- Recruiter sees the test pass count when reviewing the submission, regardless of whether the candidate ran tests manually during the session.
