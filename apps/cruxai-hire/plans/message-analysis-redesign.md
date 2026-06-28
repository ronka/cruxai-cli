# Plan: Message Analysis Redesign

> Generated from: docs/2026-04-08-message-analysis-redesign.md
> Date: 2026-04-08

## Overview

Redesign the message analysis system to classify every user message across three dimensions (intent, quality, flags) with context-aware evaluation, replacing the single overall score with per-message stats. Rename `tags` to `flags`, remove `overallScore`, and add a re-analyze capability for old submissions.

---

## Tasks

### Task 1: Type System + Schema Foundation

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

Update the core type definitions and validation schemas to support the new multi-dimensional classification. This is the foundation all other tasks depend on.

- `src/types/analysis.ts`: Add `MessageIntent` and `MessageQuality` types, add `intent` and `quality` fields to `MessageInsight`, rename `tags` to `flags` (type becomes `MessageFlag`), remove `overallScore` from `AnalysisResult`
- `src/server/analysisSchema.ts`: Update Zod schemas to validate the new shape — `intent` enum, `quality` enum, `flags` array (allow empty), remove `overallScore` validation
- `src/server/validation/submissions.ts`: Update `saveAnalysisSchema` to match the new `AnalysisResult` shape (no `overallScore`, new `messageInsights` fields)
- `src/server/db/seed.ts`: Update mock analysis data to use new shape with `intent`, `quality`, and `flags`

#### Acceptance criteria

- [ ] `MessageIntent`, `MessageQuality`, `MessageFlag` types exported from `analysis.ts`
- [ ] `MessageInsight` has `intent`, `quality`, `flags` fields; no `tags` field
- [ ] `AnalysisResult` has no `overallScore` field
- [ ] Zod schemas validate the new shape and reject the old shape
- [ ] Seed data uses the new structure with realistic intent/quality values
- [ ] `npm run build` passes

---

### Task 2: Analysis Prompt Rewrite + API Backend

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Rewrite the LLM analysis prompt and update both API paths to produce and validate the new classification shape.

- `src/server/prompts.ts`: Rewrite the analysis prompt with multi-dimensional classification instructions. Include context-aware guidance with concrete examples showing how the same short message is `adequate` in one context and `weak` in another. Instruct the LLM to classify every user message (dense, not sparse). Remove scoring guidelines.
- `src/app/api/analysis/route.ts`: Update the structured output schema passed to `generateText()` to use the new Zod schema. Add post-response validation: verify `messageInsights` count matches user message count, backfill missing entries with `{ intent: "follow-up", quality: "adequate", flags: [] }`.
- `src/server/runBackgroundAnalysis.ts`: Same schema and validation changes as the API route.

#### Acceptance criteria

- [ ] Prompt instructs LLM to classify every user message with intent, quality, and optional flags
- [ ] Prompt includes context-aware examples (same message, different quality depending on context)
- [ ] Prompt no longer requests an overall score
- [ ] API route uses updated Zod schema for structured output
- [ ] Post-response validation backfills missing message insights
- [ ] Background analysis path uses the same updated schema and validation
- [ ] Triggering an analysis produces a response with the new shape (intent + quality on every message)

---

### Task 3: ChatTimeline Update (flags + intent/quality)

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Update the `ChatTimeline` component to render the new classification data while gracefully handling old data.

- `src/components/analysis/ChatTimeline.tsx`:
  - Replace all `tags` references with `flags`
  - Timeline dots: flagged messages still get colored dots (red/amber/blue); unflagged messages keep default styling
  - Message detail view: show intent label, quality indicator (e.g., colored badge or text), and reasoning for every user message
  - Flags render as badge pills (same visual style as today) when present
  - Backward compatibility: if `intent` is missing (old data), render with just flags like today

#### Acceptance criteria

- [ ] Component uses `flags` field, no references to `tags`
- [ ] Flagged messages show colored dots on timeline (same colors: red, amber, blue)
- [ ] Every user message detail view shows intent label and quality indicator
- [ ] Reasoning is displayed for every classified message
- [ ] Old analysis data (missing `intent`/`quality`) renders gracefully with just flags
- [ ] No visual regression for unflagged messages

---

### Task 4: Score to Stats Display (Analysis + Recruiter Pages)

- **Type**: AFK
- **Blocked by**: Task 2, Task 3

#### What to build

Replace the prominent `overallScore` display with auto-derived stats on the two main analysis viewing pages.

- `src/app/questions/[id]/analysis/page.tsx`: Remove score display (large number + color coding). Replace with quality distribution (count of strong/adequate/weak as pills or bar) and flag counts (exemplar/red-flag/teaching-moment). Add backward compat: if old data has `overallScore` but no `intent`, show the old score.
- `src/app/recruiters/submissions/[submissionId]/page.tsx`: Same stats replacement. Remove `overallScore` percentage display. Position stats in the same prominent location the score occupied. Backward compat for old data.

#### Acceptance criteria

- [ ] Analysis page shows quality distribution (strong / adequate / weak counts)
- [ ] Analysis page shows flag counts (exemplar / red-flag / teaching-moment)
- [ ] Recruiter submission page shows same stats in place of score
- [ ] No `overallScore` display on either page
- [ ] Old submissions with `overallScore` but no intent/quality render gracefully (show old score or "Re-analyze for detailed breakdown")
- [ ] Stats are positioned prominently where the score used to be

---

### Task 5: Re-Analyze Button

- **Type**: AFK
- **Blocked by**: Task 2, Task 4

#### What to build

Add a re-analyze capability on the recruiter submission detail page so old submissions can be re-analyzed with the new prompt.

- `src/app/recruiters/submissions/[submissionId]/page.tsx`: Add a "Re-analyze" button that triggers a fresh analysis using the new prompt. On-demand only — no bulk or automatic re-analysis. Show loading state during re-analysis. On completion, update the displayed stats in place.

#### Acceptance criteria

- [ ] "Re-analyze" button visible on the recruiter submission detail page
- [ ] Clicking it triggers a fresh analysis via the existing API route
- [ ] Loading/progress state shown during re-analysis
- [ ] Page updates with new stats after re-analysis completes
- [ ] Old `overallScore` is replaced by new intent/quality/flags classification after re-analysis
- [ ] No bulk re-analysis capability (button is per-submission only)

---

### Task 6: Score Reference Cleanup

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Remove all remaining `overallScore` references from list/summary views across the app and replace with a compact representation of the new classification data.

- `src/app/candidates/page.tsx`: Remove `overallScore` extraction, `reviewedWithScores` filter, and `averageScore` calculation. Replace with quality distribution summary or flag counts.
- `src/app/recruiters/roles/[roleId]/page.tsx`: Remove `overallScore` percentage from submissions table. Replace with compact stats (e.g., quality pills or flag indicators).
- `src/app/recruiters/candidates/[candidateId]/page.tsx`: Same — remove score percentage, replace with compact stats.

#### Acceptance criteria

- [ ] No references to `overallScore` in any of the three pages
- [ ] Candidates page dashboard stats use new classification data (not average score)
- [ ] Roles page submission table shows compact quality/flag info instead of score percentage
- [ ] Candidate detail page shows compact quality/flag info instead of score percentage
- [ ] Old submissions without intent/quality display gracefully (e.g., "—" or "Legacy")
- [ ] `npm run build` passes with no `overallScore` references remaining in the codebase
