# Plan: Test Coverage

> Generated from: docs/2026-04-14-test-coverage-plan.md
> Date: 2026-04-14

## Overview

Add targeted unit tests (Vitest) for modules with real logic and E2E tests (Playwright) for the two main user journeys. The goal is to catch regressions during refactoring without testing thin wrappers, simple CRUD, or implementation details.

---

## Tasks

### Task 1: Vitest framework setup

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

Install Vitest and configure it so unit tests can run with the same path aliases (`@/*`) used in the main codebase. Add `test` and `test:watch` npm scripts. Verify the setup works by running vitest with a trivial placeholder test.

#### Acceptance criteria

- [ ] `vitest` added as a dev dependency
- [ ] `vitest.config.ts` exists with `@/*` path alias matching `tsconfig.json`
- [ ] `npm run test` and `npm run test:watch` scripts work
- [ ] A trivial smoke test passes to confirm the setup

#### User stories addressed

- PRD: Test Framework Setup

---

### Task 2: timerStore unit tests

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Unit tests for `src/stores/timerStore.ts` covering the timer's time math, countdown logic, and expiry rules. Use `vi.useFakeTimers()` to control `setInterval` and avoid real-time waits. Tests should exercise the store directly via Zustand's `getState()`/`setState()` — no React rendering needed.

#### Acceptance criteria

- [ ] Countdown from a limit computes correct remaining time
- [ ] `isExpired()` triggers at the exact boundary (seconds === limitSeconds)
- [ ] Hard stop flag is preserved and accessible after expiry
- [ ] `initializeWithElapsed()` resumes correctly from a saved offset (already-expired and mid-session cases)
- [ ] `getFormatted()` returns correct strings: `"00:00"`, `"59:59"`, hours format `"01:00:00"`, and mid-countdown values
- [ ] `start()` is idempotent when already running
- [ ] `reset()` clears all state and stops the interval
- [ ] Tests located at `src/stores/__tests__/timerStore.test.ts`

#### User stories addressed

- PRD 1.1: timerStore

---

### Task 3: questionStateStore unit tests

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Unit tests for `src/stores/questionStateStore.ts` covering snapshot management and hydration. Mock `Date.now()` and `Math.random()` for deterministic snapshot IDs and timestamps.

#### Acceptance criteria

- [ ] `addSnapshot()` builds correct structure with timestamp, files copy, kind, and afterMessageId
- [ ] `getSnapshot()` retrieves the right snapshot by ID
- [ ] `hydrate()` restores full state from serialized snapshots (converts ISO timestamp strings to Date objects, sets hasStarted, clears modal)
- [ ] Snapshots maintain insertion order after multiple `addSnapshot()` calls
- [ ] `addProcessedToolCall()` adds to the set without duplicates
- [ ] `reset()` returns all state to initial values
- [ ] Tests located at `src/stores/__tests__/questionStateStore.test.ts`

#### User stories addressed

- PRD 1.2: questionStateStore (snapshot logic)

---

### Task 4: question-resolver unit tests

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Unit tests for `src/server/question-resolver.ts` covering the two resolution paths (static and invite-based) and error cases. Mock the service dependencies (`getQuestionById`, `getInviteByCode`, `getCandidateById`, `getRoleById`) using `vi.mock()`.

#### Acceptance criteria

- [ ] `resolveQuestion(id, null)` returns `{ ok: true, source: 'static' }` with the question when it exists
- [ ] `resolveQuestion(id, null)` returns `{ ok: false, kind: 'not_found' }` when the question doesn't exist
- [ ] `resolveQuestion(id, code)` returns `{ ok: true, source: 'recruiter_invite' }` with invite context, candidate, and role when all are valid
- [ ] `resolveQuestion(id, code)` returns `invalid_invite` when the invite code doesn't exist
- [ ] `resolveQuestion(id, code)` returns `invalid_invite` when the candidate is missing
- [ ] Invite resolution uses `invite.questionId` over the passed `questionId` when present
- [ ] Default time constraints (`{ limit: 60, unit: 'minutes', hardStop: false }`) are applied when the question has no overrides
- [ ] `resolveInviteCode()` delegates to `resolveQuestion` and rejects non-invite results
- [ ] Tests located at `src/server/__tests__/question-resolver.test.ts`

#### User stories addressed

- PRD 1.3: question-resolver

---

### Task 5: analysisSchema unit tests

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Unit tests for `src/server/analysisSchema.ts` validating the Zod schema that gates what gets saved to the DB. Test both the `messageInsightSchema` and `analysisResponseSchema`.

#### Acceptance criteria

- [ ] A fully valid analysis payload parses successfully
- [ ] Missing required fields (`messageIndex`, `intent`, `quality`, `flags`, `reasoning`) are rejected with appropriate errors
- [ ] Invalid enum values for `intent`, `quality`, and `flags` are rejected
- [ ] Empty `messageInsights` array is accepted
- [ ] Empty `flags` array is accepted
- [ ] `messageIndex` rejects negative numbers and non-integers
- [ ] Extra/unexpected fields are handled according to Zod's default behavior (stripped)
- [ ] Tests located at `src/server/__tests__/analysisSchema.test.ts`

#### User stories addressed

- PRD 1.4: analysisSchema

---

### Task 6: Utility function unit tests (fileTree, sandbox, invite-status)

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Unit tests for three small utility modules that have meaningful logic worth protecting.

**fileTree** (`src/lib/fileTree.ts`): Test `buildFileTree()` — builds a tree from a flat file map, handles nested directories, sorts folders before files alphabetically.

**sandbox utils** (`src/lib/sandbox.ts`): Test `normalizeSandboxPath()` edge cases (strips `/vercel/sandbox/`, `./`, leading `/`) and `streamToString()` with both `ReadableStream` and Node.js stream inputs, empty streams, and multi-chunk streams.

**invite-status** (`src/lib/invite-status.ts`): Test `computeInviteStatus()` for each state combination (no submission, started, submitted, reviewed) and `buildPipelineItems()` joining invites with candidates/submissions/roles.

#### Acceptance criteria

- [ ] `buildFileTree()` produces correct nested structure from flat paths
- [ ] `buildFileTree()` sorts folders before files, both alphabetically
- [ ] `buildFileTree()` handles empty input and single-file input
- [ ] `normalizeSandboxPath()` strips all prefix variants correctly
- [ ] `normalizeSandboxPath()` handles already-clean paths
- [ ] `streamToString()` handles null input, empty stream, and multi-chunk stream
- [ ] `computeInviteStatus()` returns correct status for each submission state
- [ ] `buildPipelineItems()` correctly joins invites with candidates, submissions, and roles
- [ ] `buildPipelineItems()` skips invites with missing candidates
- [ ] Tests located at `src/lib/__tests__/fileTree.test.ts`, `src/lib/__tests__/sandbox.test.ts`, `src/lib/__tests__/invite-status.test.ts`

#### User stories addressed

- PRD 1.5: Utility functions with logic

---

### Task 7: E2E test infrastructure setup

- **Type**: HITL
- **Blocked by**: None - can start immediately

#### What to build

Update the Playwright configuration and set up the infrastructure needed to run E2E tests. This requires decisions on test data seeding and authentication state management.

Key decisions needed:
- **Test data**: Reuse the existing `db:seed` script or create dedicated E2E fixtures? Need a repeatable way to set up a recruiter user, a question, an invite, and a candidate.
- **Auth state**: Set up Playwright `storageState` for authenticated sessions. Need to create an auth setup project that logs in and saves session cookies.
- **testDir**: The PRD specifies `e2e/` but the current config points to `./tests`. Update to `e2e/`.

#### Acceptance criteria

- [ ] `playwright.config.ts` updated with `testDir: './e2e'`
- [ ] Auth setup project configured — logs in as a test recruiter user and saves `storageState`
- [ ] Test data seeding strategy decided and documented (seed script or fixtures)
- [ ] `e2e/` directory created with a trivial smoke test that loads the app
- [ ] `npm run test:e2e` works end-to-end

#### User stories addressed

- PRD: Test Framework Setup (Playwright portion)
- PRD: Mocking Strategy (Playwright auth)

---

### Task 8: Candidate flow E2E

- **Type**: AFK
- **Blocked by**: Task 7

#### What to build

End-to-end test covering the complete candidate journey as described in PRD 2.1. Uses a seeded invite code to walk through the full flow from landing on the invite link to ending the session.

#### Acceptance criteria

- [ ] Visit invite link — consent screen renders with question details
- [ ] Accept and start — sandbox is created, timer is visible, chat input is ready
- [ ] Send a message — streaming AI response appears in the chat
- [ ] AI edits a file — file tree updates with the new/modified file, preview refreshes
- [ ] End session — redirected to thank-you/completion page
- [ ] Test located at `e2e/candidate-flow.spec.ts`

#### User stories addressed

- PRD 2.1: Candidate Flow

---

### Task 9: Recruiter flow E2E

- **Type**: AFK
- **Blocked by**: Task 7

#### What to build

End-to-end test covering the recruiter dashboard journey as described in PRD 2.2. Uses the authenticated recruiter session from the auth setup project.

#### Acceptance criteria

- [ ] Login — dashboard loads with existing data
- [ ] Create a question — new question appears in the questions list
- [ ] Create a role and assign the question to it
- [ ] Generate an invite link — link is displayed and copyable
- [ ] View a completed submission — messages and analysis data are visible
- [ ] Test located at `e2e/recruiter-flow.spec.ts`

#### User stories addressed

- PRD 2.2: Recruiter Flow

---

### Task 10: Session restore and edge cases E2E

- **Type**: AFK
- **Blocked by**: Task 7

#### What to build

End-to-end tests covering session restoration (PRD 2.3) and key edge cases (PRD 2.4). These verify resilience and recovery behaviors.

#### Acceptance criteria

- [ ] Start a session, send messages, navigate away, return — messages are restored
- [ ] Timer resumes at the correct offset after returning (not restarted from zero)
- [ ] Sandbox reconnects after page return
- [ ] Timer hard stop: session ends automatically when time runs out (chat input disabled)
- [ ] Invalid invite code: error page is shown with appropriate message
- [ ] Test located at `e2e/session-restore.spec.ts`

#### User stories addressed

- PRD 2.3: Session Restoration
- PRD 2.4: Key Edge Cases
