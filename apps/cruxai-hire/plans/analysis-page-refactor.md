# Plan: Analysis Page Refactor with Hire Recommendation

> Generated from: conversation
> Date: 2026-05-13

## Overview

Refactor the candidate-facing analysis page and aligned recruiter views to surface a high-signal hiring verdict and a scannable TL;DR of flagged moments. Adds a second, independent AI call that analyzes the entire interview and returns a `strong / medium / no_hire` recommendation with a one-sentence reasoning, persisted in two new columns on `submissions`. The existing per-message classifier (`messageInsights`) is preserved unchanged. The page is reorganized into a two-row stat grid (verdict promoted, tokens demoted), a new TL;DR section listing flagged prompts chronologically with click-to-jump into the timeline, and the existing timeline kept below as deep-dive. The recruiter submission detail page adopts the same layout via a shared component; list-view compact analysis surfaces the verdict pill alongside flag counts. No data migration script — Drizzle schema migration only; existing rows are repopulated via the existing re-analyze button (now fires both calls in parallel). All legacy `overallScore` paths and the `mockChatHistory` fallback in `ChatTimeline` are removed.

---

## Tasks

### Task 1: Hire recommendation end-to-end (minimal display)

Status: done

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

End-to-end pipeline that generates and stores a hire recommendation for a submission, with a minimal UI rendering to verify the wiring. No layout restructure yet — verdict appears as a new 6th card in the existing stat grid on `/questions/[id]/analysis`.

- Drizzle migration adding two columns to `submissions`:
  - `hire_recommendation` — Postgres enum `'strong' | 'medium' | 'no_hire'` (nullable)
  - `hire_reasoning` — text (nullable; ≤ 1 sentence in practice)
- New prompt builder `getHireRecommendationPrompt` in `src/server/prompts.ts` (separate prompt from per-message classifier; focus is whole-interview judgment).
- New Zod schema `hireRecommendationResponseSchema` in `src/server/analysisSchema.ts` (or co-located): `{ recommendation, reasoning }`.
- New service module function (e.g. `generateHireRecommendation` in `src/server/services/submissions.ts` or a new `src/server/services/hire-recommendation.ts`) callable from anywhere (script, procedure, etc.). Service persists via `saveHireRecommendation(submissionId, { recommendation, reasoning })`.
- New tRPC procedure `analysis.generateHireRecommendation` (thin wrapper over the service). Persists via `after()`, mirrors the existing `analysis.generate` pattern; increments token usage on the submission.
- New React Query hook `useHireRecommendationMutation` in `src/hooks/`.
- New trigger hook `useTriggerHireRecommendation` (mirrors `useTriggerQuestionAnalysis`): auto-fires when `submission.hireRecommendation == null` and the conversation has user messages. Wired into the candidate analysis page in parallel with the existing message-insights trigger.
- Render the verdict as a 6th card in the existing stat grid (colored pill: green/yellow/red for strong/medium/no_hire). Reasoning not displayed yet (banner comes in Task 1b).

#### Acceptance criteria

- [x] Submitting a fresh session triggers both `analysis.generate` and `analysis.generateHireRecommendation` in parallel.
- [x] Both calls persist independently — a failure in one does not block the other from saving.
- [x] `hire_recommendation` and `hire_reasoning` columns are populated on the DB row.
- [x] Verdict pill renders on the candidate analysis page as the 6th stat card.
- [x] Token usage from the new call is added to `submissions.tokensIn` / `tokensOut`.
- [x] No regressions to existing `messageInsights` flow.

#### User stories addressed

- Recruiter sees a single-glance hire verdict for each interview.
- Verdict is computed and stored independently of per-message analysis.

---

### Task 2: ChatTimeline cleanup

Status: done

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

Clean up `src/components/analysis/ChatTimeline.tsx` and prepare it to be controlled from outside (so the TL;DR can jump to a specific message).

- Remove `mockChatHistory` constant and the `messages.length === 0` fallback branch that renders mock data.
- Add a real empty state when there are no messages (e.g. card with `"No conversation recorded"`).
- Lift `currentIndex` to a controlled prop OR expose an imperative `setCurrentIndex` API (e.g. via `forwardRef` + `useImperativeHandle`). Choice: controlled prop with `currentIndex` + `onCurrentIndexChange` is preferred — simpler React mental model than imperative refs.
- Internal state (`isPlaying`) stays internal; only the index is lifted.
- Existing slider/play/pause behavior unchanged.

#### Acceptance criteria

- [x] `mockChatHistory` and all references to it are removed.
- [x] Page renders a real empty state when `messages` is empty (no mock content).
- [x] `ChatTimeline` exposes `currentIndex` + `onCurrentIndexChange` props; parents can drive scrubbing.
- [x] Existing usage in candidate analysis page continues to work (parent now owns the index).
- [x] No visual regressions to the timeline itself.

#### User stories addressed

- Recruiter / candidate can still scrub the full conversation timeline.
- TL;DR will be able to jump the timeline to a specific message (enabled by this slice, used in Task 3).

---

### Task 3: TL;DR section on candidate page

Status: done

- **Type**: AFK
- **Blocked by**: Task 2

#### What to build

A new section on the candidate analysis page that surfaces every flagged user message in chronological order, so the recruiter does not have to scrub the timeline to find the important moments.

- New component `src/components/analysis/AnalysisTLDR.tsx`.
- Takes `messages: StoredMessage[]` and `messageInsights: MessageInsight[]`.
- Filters insights to those with at least one flag (`red-flag`, `exemplar`, or `teaching-moment`).
- Renders rows chronologically (by `messageIndex`), each row compact (~80 px tall) showing: flag badge(s), elapsed timestamp, first ~120 chars of the user's prompt.
- Click on a row toggles expansion to show: full prompt text + the model's `reasoning` string.
- A "jump to timeline" affordance (icon button on each row) sets `currentIndex` on the parent so the timeline scrolls/displays that message. Implementation: parent owns `currentIndex` state and passes it to both `ChatTimeline` and `AnalysisTLDR`.
- Empty state: when there are zero flagged messages, render a muted placeholder (e.g. `"No notable moments flagged in this interview."`) — section is visible but minimal.
- Placed in the page layout between the stat grid and the timeline.

#### Acceptance criteria

- [x] TL;DR section appears below the stat grid and above the timeline on the candidate analysis page.
- [x] Only messages with at least one flag are listed.
- [x] Rows are sorted chronologically by `messageIndex`.
- [x] Each row collapses to a compact preview by default and expands on click to show full prompt + reasoning.
- [x] Clicking the jump affordance scrubs the timeline to the corresponding message.
- [x] When no flags exist, the section shows the empty-state placeholder.
- [x] Component renders correctly when `messageInsights` is loading (parent skeleton is sufficient).

#### User stories addressed

- Recruiter quickly identifies red flags, exemplars, and teaching moments without scrubbing.
- TL;DR doubles as an index into the deeper timeline view.

---

### Task 4: Re-analyze button fires both calls in parallel

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

The existing re-analyze button on `src/app/recruiters/submissions/[submissionId]/page.tsx` currently only re-runs the per-message classifier. Update it to fire both calls in parallel so the recruiter can repopulate the hire recommendation (especially needed for pre-migration submissions where `hire_recommendation IS NULL`).

- Call both `useAnalysisMutation` and `useHireRecommendationMutation` from the button's handler simultaneously.
- Maintain independent loading/error UI for each call (mirrors the architecture of Task 1's trigger hooks).
- After re-analysis, the page should show the freshly-returned verdict alongside the fresh insights (minimal UI for now — full recruiter layout redesign lands in Task 5).
- Confirm that an existing submission with `hire_recommendation = NULL` can be repopulated via this button.

#### Acceptance criteria

- [x] Re-analyze button on the recruiter submission page triggers both mutations in parallel.
- [x] The new hire recommendation is persisted and reflected in the UI on success.
- [x] If one call fails, the other still completes and persists.
- [x] Token counters on the submission reflect both calls' usage.
- [x] Pre-migration submissions (`hire_recommendation IS NULL`) can be backfilled by clicking the button.

#### User stories addressed

- Recruiter can repopulate hire recommendations for existing submissions without a data-migration script.
- Re-analysis stays consistent — both outputs are regenerated together.

---

### Task 5: Shared AnalysisView + recruiter submission page redesign

Status: done

- **Type**: AFK
- **Blocked by**: Task 1b (stat grid restructure), Task 3 (TL;DR), Task 4 (re-analyze wired)

#### What to build

Extract the candidate analysis page's layout into a reusable component and adopt it on the recruiter submission detail page.

- New shared component `src/components/analysis/AnalysisView.tsx`.
- Owns the layout: stat grid (two rows), reasoning banner, TL;DR section, timeline. Owns the `currentIndex` state coordinating TL;DR ↔ timeline. Renders per-section skeletons + error states.
- Takes a submission-like object plus current analysis data (insights + verdict) as props. No data fetching inside — pure presentational.
- Refactor `src/app/questions/[id]/analysis/page.tsx` to use it (with candidate chrome: header + "Try Again" footer CTA).
- Refactor `src/app/recruiters/submissions/[submissionId]/page.tsx` to use it (with recruiter chrome: header + re-analyze button + back to submissions list).
- Both pages should produce identical analysis output; only surrounding chrome differs.

#### Acceptance criteria

- [x] `AnalysisView` component exists and is used by both the candidate analysis page and the recruiter submission page.
- [x] Both pages produce the same stat-grid / reasoning-banner / TL;DR / timeline layout.
- [x] Candidate page retains "Try Again" CTA; recruiter page retains the re-analyze button.
- [x] Per-section skeletons and error states behave identically on both pages.
- [x] No regressions in either page's behavior or styling.

#### User stories addressed

- Recruiter and candidate see the same analysis presentation, eliminating drift.
- Layout changes can be made in one place going forward.

---

### Task 6: CompactAnalysis verdict in list views

Status: done

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Update the `CompactAnalysis` component used in recruiter list views to lead with the new hire verdict.

- Affected files:
  - `src/app/recruiters/roles/[roleId]/page.tsx` (contains `CompactAnalysis`)
  - `src/app/recruiters/candidates/[candidateId]/page.tsx` (contains its own `CompactAnalysis`)
- Update each to take the hire recommendation as input (passed from the parent's submission row).
- Render: verdict pill (primary, colored) + small flag-count badges (subtext).
- When `hire_recommendation IS NULL`, render the existing `<span className="text-muted-foreground">—</span>` placeholder (consistent with current null-analysis behavior).
- Filtering/sorting by verdict is out of scope for this slice but the DB shape already supports it.

#### Acceptance criteria

- [x] Both recruiter list pages show the verdict pill prominently for submissions that have one.
- [x] Flag counts continue to appear as subtext.
- [x] Rows with `hire_recommendation = NULL` render `—` (no broken UI).
- [x] No filter/sort UI added in this task.

#### User stories addressed

- Recruiter scans candidate / role lists and sees hire verdicts at a glance.

---

### Task 7: Legacy `overallScore` cleanup

Status: done

- **Type**: AFK
- **Blocked by**: Task 1, Task 5, Task 6

#### What to build

Remove all remaining backward-compatibility code that reads the legacy `overallScore` field from `analysisResult`. After upstream slices land, nothing in the UI should read it.

- Grep `src/` for `overallScore` and remove every reference. Known locations:
  - `src/app/recruiters/roles/[roleId]/page.tsx` (lines around 63 and 402)
  - `src/app/recruiters/candidates/[candidateId]/page.tsx` (line around 31)
  - `src/app/recruiters/submissions/[submissionId]/page.tsx` (line around 151)
- Confirm the legacy data itself (already-stored `overallScore` values inside `analysisResult` JSONB) is *not* removed from the DB — only the code paths reading it are deleted.
- Run `npm run lint` and `npm run build` to verify no dangling references.

#### Acceptance criteria

- [x] `grep -r "overallScore" src/` returns no results.
- [x] `npm run lint` passes.
- [x] `npm run build` passes.
- [x] No UI behavior changes — the legacy field was already a fallback in code paths that have new primary signals.

#### User stories addressed

- Codebase no longer carries backward-compat shims for the pre-launch analysis schema.
