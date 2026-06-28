# Simplify "Send Question" UX

Two small UX improvements to reduce friction when sending an assessment link to a candidate.

## Goals

1. From `/recruiters?tab=candidates`, add a row-level "Send question" action (via a 3-dots menu) that lets the recruiter pick a question and generate an invite link — without first navigating to a role.
2. From `/recruiters/roles/{id}`, add an "Add Candidate" button next to "Edit Role" so a recruiter can grow their candidate pool from the role page directly.

---

## Open question (please confirm before implementation)

`invites` requires both `candidateId`, `roleId`, and `questionId` (see `src/hooks/send-to-candidate/useSendToCandidate.ts:24-29`). The user said "select the question" — but the invite still needs a role. Three options:

- **A. Pick question + role in the dialog** (two selects). Most explicit, one extra click. Recommended.
- **B. Pick question only, infer role from the question's first associated role.** Fewer clicks, but ambiguous when a question is on multiple roles or none.
- **C. Pick role first, then question filtered to questions attached to that role.** Funnels the choice but adds a step.

Plan below assumes **option A** unless told otherwise.

---

## Change 1 — Row-level "Send question" from the candidates tab

### Files to touch

- `src/app/recruiters/page.tsx` — add a 3-dots menu cell in the candidates `<Table>` (lines 253-280).
- `src/components/recruiters/SendToCandidateDialog.tsx` — make `roleId` selectable inside the dialog when not provided by parent (currently it's a required prop, line 30).
- `src/hooks/send-to-candidate/useSendToCandidate.ts` — accept an optional/internal `roleId` so the dialog can drive it. Today `roleId` is read from props at hook init (line 10).

### Approach

1. In `src/app/recruiters/page.tsx`:
   - Import `DropdownMenu` from `@/components/ui/dropdown-menu` and `MoreHorizontal` from `lucide-react`.
   - Add an "Actions" column to the candidates table. Each row gets a `<DropdownMenu>` with a single "Send question" item.
   - `onClick` on the row navigates to the candidate detail (existing behavior). Make sure the menu trigger calls `e.stopPropagation()` so opening the menu doesn't also navigate.
   - Track `sendDialogCandidate` state (`Candidate | null`). When set, render the new `SendQuestionToCandidateDialog`.

2. Create a new dialog `src/components/recruiters/SendQuestionToCandidateDialog.tsx` (don't overload `SendToCandidateDialog` — its current call sites pass a known question+role).
   - Props: `open`, `onOpenChange`, `candidateId`, `candidateName`.
   - Selects: Role (from `useRolesQuery`) and Question (from `useQuestionsQuery`, optionally filtered to `role.questionIds` once a role is picked).
   - On submit: same flow as `useSendToCandidate.handleSubmit` (generate code → `invites.create` → `submissions.createFromInvite` → show link).
   - Reuse the success state UI (copyable link) from `SendToCandidateDialog` (lines 76-107). Consider extracting a tiny `<InviteLinkCallout>` component shared between both dialogs to avoid duplication; only do this if it's a clean 10-15 line component, otherwise inline.

3. Extend `useSendToCandidate.ts` to accept `roleId` and `questionId` as optional initial state but allow override on `handleSubmit`. Simpler alternative: skip the hook and write the new dialog's submit inline — it's ~10 lines.

### UX details

- Menu items: only "Send question" for now. Leave the menu structure so we can add more actions later (e.g., "Delete candidate", "View details").
- Make the dropdown trigger a small ghost button (`<MoreHorizontal />`) with `aria-label="Actions"`.
- Cell should be right-aligned and narrow (`className="w-12"`).

---

## Change 2 — "Add Candidate" button on the role detail page

### Files to touch

- `src/app/recruiters/roles/[roleId]/page.tsx` — add the button to the header row (lines 172-183) and wire up `InviteCandidateDialog`.

### Approach

1. Import `InviteCandidateDialog` and `useCreateCandidateMutation` (already used on the main page — copy the `handleInviteCandidate` pattern from `src/app/recruiters/page.tsx:88-101`).
2. Add `inviteDialogOpen` local state.
3. New button between the title block and the existing Edit/Cancel button:
   ```tsx
   <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
     <UserPlus className="mr-2 h-4 w-4" />
     Add Candidate
   </Button>
   ```
   Wrap both buttons in a `flex items-center gap-2` div.
4. Mount `<InviteCandidateDialog>` at the bottom of the component (next to `SendToCandidateDialog`).

### UX question (please confirm)

`InviteCandidateDialog` only collects name/email/notes — it doesn't tie the candidate to a role (candidates and roles are linked through invites, not directly). Two interpretations:

- **A. Pure "add candidate"** — same as the main page's button; adds them to the recruiter's pool but doesn't invite them to this specific role. Simplest.
- **B. "Add and invite to this role"** — collect name/email/notes, then immediately open the "Send question" dialog pre-scoped to this role.

**A** matches the user's literal wording. **B** is more useful in context. Default to **A**; add a follow-up toast like *"Candidate added. Send them an assessment from the Questions tab."* if helpful.

---

## Verification

After implementing both changes:

1. `npm run typecheck` (or whatever the repo uses — check `package.json`).
2. Manual browser test via the `cruxai-browser-test` skill:
   - Go to `/recruiters?tab=candidates`, click the 3-dots menu on a candidate row, pick "Send question", choose a role+question, confirm a link is generated and copyable.
   - Go to `/recruiters/roles/{id}`, click "Add Candidate", add a candidate, confirm the new candidate appears in `/recruiters?tab=candidates`.
   - Confirm clicking the menu trigger doesn't also navigate to the candidate detail page.

## Out of scope

- Bulk "Send question" to multiple candidates.
- Editing/deleting candidates from the row menu (leave a stub for follow-up).
- Any change to how invites/submissions are persisted server-side.
