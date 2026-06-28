# Schema Migration: Introduce `invites` Table

## Problem

The `candidates` table conflates **person identity** with **invite state**. A candidate (person) who gets invited to two different roles requires two separate `candidates` rows with different IDs — duplicating the person. The `candidate_question_assignments` junction table tracks "which questions for this candidate" but is really "which questions for this invite." Candidate status (`invited`/`started`/`submitted`/`reviewed`) mirrors submission lifecycle and is fully derivable.

## Target Schema

### `candidates` — person only
```
id          uuid PK
name        text NOT NULL
email       text NOT NULL UNIQUE
notes       text
createdAt   timestamp
```

### `invites` — new, the unit of work
```
id           uuid PK
candidateId  uuid FK → candidates.id (CASCADE)
roleId       uuid FK → job_roles.id (CASCADE)
questionId   uuid FK → questions.id (CASCADE)
inviteCode   text NOT NULL UNIQUE
notes        text
createdAt    timestamp
```

### `submissions` — linked to invite, not to candidate/role/question separately
```
id              uuid PK
inviteId        uuid FK → invites.id (CASCADE)    ← NEW (replaces roleId + questionId + candidateId)
status          enum('in_progress','submitted','reviewed')  ← 'not_started' removed
chatMessages    jsonb
snapshots       jsonb
initialFiles    jsonb
finalFiles      jsonb
analysisResult  jsonb
timeSpent       text
timeExceeded    boolean
tokensIn        integer
tokensOut       integer
messageCount    integer
startedAt       timestamp
submittedAt     timestamp
reviewedAt      timestamp    ← NEW (moved from candidates, tracks recruiter review)
createdAt       timestamp
updatedAt       timestamp
```

### Removed
| What | Why |
|---|---|
| `candidate_question_assignments` table | Replaced by `invites` |
| `candidates.roleId` | Relationship is per-invite, not per-person |
| `candidates.inviteCode` | Moved to `invites` |
| `candidates.status` + `candidateStatusEnum` | Fully derivable (see below) |
| `candidates.invitedAt/startedAt/submittedAt/reviewedAt` | `createdAt` on invite, timestamps on submission |
| `submissions.roleId/questionId/candidateId` | Derivable via `inviteId → invite` |
| `submissionStatusEnum` value `not_started` | No submission row = not started |
| `jobRoles.candidateCount/submissionCount/pendingReviews` | Compute via queries |

### Computed Candidate Status (per invite)
```
no submission for invite         → "invited"
submission.startedAt exists      → "started"
submission.submittedAt exists    → "submitted"
submission.reviewedAt exists     → "reviewed"
```

Aggregate candidate status across all invites = max(per-invite statuses), or just show per-invite.

---

## Migration Phases

### Phase 1: Schema — New tables + data migration

**Drizzle schema changes:**

1. Create `src/server/db/schema/invites.ts`
   - Table definition with `candidateId`, `roleId`, `questionId`, `inviteCode`

2. Modify `src/server/db/schema/candidates.ts`
   - Remove: `roleId`, `inviteCode`, `status`, `invitedAt`, `startedAt`, `submittedAt`, `reviewedAt`
   - Add: `email` unique constraint
   - Keep: `id`, `name`, `email`, `notes`, `createdAt`

3. Modify `src/server/db/schema/submissions.ts`
   - Add: `inviteId` FK, `reviewedAt` timestamp
   - Remove: `roleId`, `questionId`, `candidateId`
   - Remove `not_started` from `submissionStatusEnum`

4. Modify `src/server/db/schema/job-roles.ts`
   - Remove: `candidateCount`, `submissionCount`, `pendingReviews`

5. Delete `src/server/db/schema/candidate-question-assignments.ts`

6. Update `src/server/db/schema/enums.ts`
   - Remove `candidateStatusEnum`
   - Update `submissionStatusEnum` → `['in_progress', 'submitted', 'reviewed']`

7. Update `src/server/db/schema/relations.ts`
   - Add `invites` relations
   - Remove `candidateQuestionAssignments` relations
   - Update `submissions` relations (through `inviteId`)

8. Update `src/server/db/schema/index.ts` — export invites, remove candidate-question-assignments

9. Update `src/server/db/seed.ts`
   - Create candidates as people (deduped by email)
   - Create invites linking candidates → roles → questions
   - Create submissions linked to invites

**Files touched:** 9 files in `src/server/db/`

---

### Phase 2: Service layer

1. **Create `src/server/services/invites.ts`**
   - `listInvites(filters?: { candidateId?, roleId?, questionId? })`
   - `getInviteById(id)`
   - `getInviteByCode(code)` — replaces `getCandidateByInviteCode()`
   - `createInvite(data: { candidateId, roleId, questionId, inviteCode, notes? })`
   - `deleteInvite(id)`

2. **Simplify `src/server/services/candidates.ts`**
   - `listCandidates()` — no more status/roleId filters (those are on invites)
   - `getCandidateById(id)`
   - `getCandidateByEmail(email)` — for dedup on invite
   - `createCandidate(data: { name, email, notes? })`
   - `updateCandidate(id, updates)`
   - `deleteCandidate(id)`
   - Remove: `getCandidateByInviteCode`, `updateCandidateStatus`, all `candidateQuestionAssignments` logic

3. **Update `src/server/services/submissions.ts`**
   - `createSubmission(data: { inviteId })` — status defaults to `in_progress`
   - `listSubmissions(filters?: { inviteId?, roleId?, candidateId? })` — roleId/candidateId filters join through invites
   - Remove `roleId`, `questionId`, `candidateId` from create/update
   - `submitWithSession()` — same but no candidate status update
   - `saveAnalysis()` — sets `reviewedAt` instead of relying on separate candidate status

4. **Update `src/server/services/roles.ts`**
   - Remove counter update logic (`candidateCount`, `submissionCount`, `pendingReviews`)
   - Add computed count queries (or return counts via joins in list queries)

5. **Update `src/server/question-resolver.ts`**
   - `resolveInviteCode(code)` → query `invites` table → join question + role + candidate
   - `resolveQuestion(questionId, inviteCode?)` → same but uses invite lookup

**Files touched:** 5 files in `src/server/`

---

### Phase 3: Types + Validation

1. **Update `src/types/recruiter.ts`**
   - `Candidate`: remove `roleId`, `inviteCode`, `status`, `assignedQuestionIds`, timestamps (except `createdAt`)
   - Add `Invite` type: `{ id, candidateId, roleId, questionId, inviteCode, notes?, createdAt }`
   - `Submission`: replace `roleId/questionId/candidateId` with `inviteId`, add `reviewedAt`
   - Remove `CandidateStatus` type
   - Update `SubmissionStatus` — remove `not_started`
   - `JobRole`: remove `candidateCount`, `submissionCount`, `pendingReviews`

2. **Update `src/types/question-resolved.ts`**
   - `InviteContext`: reference `Invite` + `Candidate` instead of just `Candidate`

3. **Update `src/types/candidate.ts`** (if it has status refs)

4. **Update `src/server/validation/candidates.ts`**
   - Simplify to just `name`, `email`, `notes`

5. **Create `src/server/validation/invites.ts`**
   - `createInviteSchema`: `candidateId`, `roleId`, `questionId`, `inviteCode`

6. **Update `src/server/validation/submissions.ts`**
   - Replace `roleId/questionId/candidateId` with `inviteId` in create schema
   - Remove `not_started` from status enum

**Files touched:** ~6 files in `src/types/` and `src/server/validation/`

---

### Phase 4: API routes

1. **Create `src/app/api/invites/` routes**
   - `GET /api/invites?candidateId=&roleId=` — list invites
   - `POST /api/invites` — create invite
   - `GET /api/invites/[inviteId]` — get invite
   - `DELETE /api/invites/[inviteId]` — delete invite

2. **Update `src/app/api/invite/[code]/route.ts`**
   - Use `getInviteByCode()` instead of `getCandidateByInviteCode()`

3. **Simplify `src/app/api/candidates/` routes**
   - Remove status endpoint (`/candidates/[id]/status`)
   - Remove invite-code lookup (`/candidates/invite/[inviteCode]`)
   - Simplify create/update payloads

4. **Update `src/app/api/submissions/` routes**
   - Create accepts `inviteId` instead of `roleId + questionId + candidateId`
   - List supports filtering via invite joins

5. **Update `src/app/api/roles/` routes**
   - Remove counter fields from responses
   - Add computed counts in list/detail responses (via joins or subqueries)

**Files touched:** ~8-10 files in `src/app/api/`

---

### Phase 5: React Query hooks

1. **Create `src/hooks/api/invites.ts`**
   - `useInvitesQuery(filters?)`, `useInviteQuery(id)`, `useCreateInviteMutation()`, `useDeleteInviteMutation()`

2. **Simplify `src/hooks/api/candidates.ts`**
   - Remove `useUpdateCandidateStatusMutation()`
   - Simplify `useCreateCandidateMutation()` (no questionIds, inviteCode)

3. **Update `src/hooks/api/submissions.ts`**
   - `useCreateSubmissionMutation()` — accepts `inviteId`

4. **Rewrite `src/hooks/send-to-candidate/useSendToCandidate.ts`**
   - Now: generate inviteCode → create invite → create submission → return link
   - No longer updates candidate's questionIds or status

5. **Rewrite `src/hooks/invite-landing/useInviteStart.ts`**
   - Now: create submission for invite (status = `in_progress`) → navigate
   - No longer updates candidate status

6. **Rewrite `src/hooks/question-page/useInviteEndQuestion.ts`**
   - Now: find submission by inviteId → submitWithSession
   - No longer updates candidate status

**Files touched:** ~6 files in `src/hooks/`

---

### Phase 6: Frontend pages + components

1. **`src/app/recruiters/candidates/[candidateId]/page.tsx`**
   - Fetch invites for candidate instead of using `assignedQuestionIds`
   - Compute status per-invite from submissions
   - Show invite timeline instead of candidate timeline
   - Remove status select (status is computed)

2. **`src/app/recruiters/roles/[roleId]/page.tsx`**
   - Fetch invites + submissions for role to compute pipeline/stats
   - Replace `candidateCount`/`submissionCount`/`pendingReviews` with computed values

3. **`src/app/recruiters/page.tsx`**
   - Compute stats from invites/submissions instead of role counter fields
   - Update invite flow to create invite (not update candidate)

4. **`src/app/recruiters/submissions/[submissionId]/page.tsx`**
   - Derive role/question/candidate from `submission.invite`
   - Replace `submission.roleId`/`questionId` with invite chain

5. **`src/app/candidates/page.tsx`**
   - Fetch invites for candidate → derive assessments list
   - Status computed from invite + submission

6. **`src/components/recruiters/SendToCandidateDialog.tsx`**
   - Creates invite instead of updating candidate

7. **`src/components/recruiters/SubmissionStatusSelect.tsx`**
   - Remove `not_started` option

8. **`src/components/recruiters/InviteCandidateDialog.tsx`**
   - Creates candidate (if new) + invite in one flow

9. **Pipeline components (CandidatePipeline, CandidateCard)**
   - Group by computed status from invites/submissions

**Files touched:** ~10 files in `src/app/` and `src/components/`

---

## Implementation Order & Dependencies

```
Phase 1 (Schema)
  └→ Phase 2 (Services)
       └→ Phase 3 (Types + Validation)
            └→ Phase 4 (API Routes)
                 └→ Phase 5 (Hooks)
                      └→ Phase 6 (Frontend)
```

Each phase depends on the previous. Within a phase, files can be worked in parallel.

## Risk Notes

- **Seed data**: Must be rewritten to match new structure. Run `seed.ts` after migration to verify.
- **Drizzle migration**: Generate via `npx drizzle-kit generate` after schema changes. Since this is pre-production, a fresh migration replacing `0000_long_rhino.sql` is cleanest.
- **Invite code uniqueness**: Moves from `candidates.inviteCode` (unique per candidate) to `invites.inviteCode` (unique per invite). Same constraint, different table.
- **Candidate dedup**: With `candidates.email` as unique, the "invite candidate" flow must check for existing candidate by email before creating a new row.
- **Submission status `not_started` removal**: Every place that checks for `not_started` needs updating — the absence of a submission row replaces this state.
- **Counter fields removal from `jobRoles`**: Every UI that displays these counts must switch to computed queries. Consider adding computed count fields to the roles list API response to avoid N+1 queries.
