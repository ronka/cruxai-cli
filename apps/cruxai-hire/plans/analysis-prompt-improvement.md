# Plan: Analysis Prompt Improvement & Rerun Script

> Generated from: plans/2026-04-02-analysis-prompt-improvement.md
> Date: 2026-04-02

## Overview

Improve red-flag detection in the `getAnalysisPrompt` function and create a standalone rerun script for fast prompt iteration. The current prompt misses obvious red-flag behaviors (blind error dumping, over-reliance on AI) due to a tagging percentage cap, narrow examples, and unnumbered messages.

---

## Tasks

### Task 1: Rerun analysis script

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

A standalone TypeScript script at `scripts/rerun-analysis.ts` that connects directly to the database via Drizzle, fetches a submission by ID, runs the full analysis pipeline (`getAnalysisPrompt` → `generateText` with `analysisResponseSchema`), and prints human-readable formatted output to stdout. Reuses existing server modules: `getAnalysisPrompt`, `analysisResponseSchema`, `simplifyMessages`, `snapshotsToSystemMessages`, `getDefaultModel`, `saveAnalysis`.

CLI: `tsx scripts/rerun-analysis.ts <submission-id> [--save] [--model <model-id>]`

#### Acceptance criteria

- [ ] Script fetches submission and associated question from DB by submission ID
- [ ] Loads env from `.env` / `.env.local` for `AI_GATEWAY_API_KEY` and `DATABASE_URL`
- [ ] Runs analysis pipeline identical to `runBackgroundAnalysis.ts`
- [ ] Default output is human-readable: overall score, then each tagged message showing index, original message content (truncated if long), tag(s), and reasoning
- [ ] `--save` flag overwrites `analysis_result` in DB via `saveAnalysis`
- [ ] `--model <model-id>` overrides the default model
- [ ] Graceful error messages for missing submission, missing env vars, missing question

#### User stories addressed

- Part 1: Rerun Script
- Validation: baseline capture and comparison

---

### Task 2: Number messages in conversation log

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Change the message formatting in `getAnalysisPrompt` (`src/server/prompts.ts`) so each message in the conversation log is prefixed with its 0-based index. This ensures the LLM can reliably produce correct `messageIndex` values in the structured output, especially for long conversations.

Before: `[USER]: content`
After: `[#0 USER]: content`

#### Acceptance criteria

- [ ] Conversation log in the prompt uses format `[#N ROLE]: content` where N is the 0-based message index
- [ ] No changes to the `AnalysisPromptInput` interface or `analysisResponseSchema`
- [ ] Verifiable by running Task 1 script — message indices in output should match numbered messages

#### User stories addressed

- Part 2a: Number messages in conversation log

---

### Task 3: Improve red-flag detection in prompt

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Two changes to the tagging instructions in `getAnalysisPrompt`:

1. **Remove the tagging percentage cap.** Replace "Tag approximately 10-20% of messages (only the most notable ones)" with guidance to tag every message that meets the criteria without artificial limits.

2. **Expand the red-flag definition** with four explicit subcategories, each with a concrete example:
   - Blind error dumping — pasting errors/stack traces without analysis or context
   - Over-reliance on AI — zero independent effort ("fix it", "make it work")
   - Ignoring previous guidance — repeating mistakes already addressed
   - No debugging attempt — not reading errors or narrowing the problem before asking

Keep exemplar and teaching-moment definitions unchanged. Keep scoring guidelines independent from tag counts.

#### Acceptance criteria

- [ ] Percentage cap language removed from prompt
- [ ] Replacement language encourages tagging every qualifying message
- [ ] Four red-flag subcategories added with concrete examples
- [ ] Exemplar and teaching-moment sections unchanged
- [ ] Scoring guidelines unchanged
- [ ] Verifiable by running Task 1 script — previously untagged red-flag messages should now be tagged

#### User stories addressed

- Part 2b: Remove the tagging percentage cap
- Part 2c: Add explicit red-flag subcategories

---

### Task 4: Validate against target submission and persist

- **Type**: HITL
- **Blocked by**: Task 1, Task 2, Task 3

#### What to build

Run the rerun script against submission `81cb0616-74dc-42ab-a138-000a3d2263f4` to validate that the prompt changes improve red-flag detection. Compare output before and after prompt changes. When satisfied, persist with `--save`.

#### Acceptance criteria

- [ ] Baseline captured: script run with old prompt, output saved/noted
- [ ] Post-change run shows previously missed red-flag messages now tagged
- [ ] No obviously incorrect tags (false positives reviewed)
- [ ] Final result persisted to DB with `--save`

#### User stories addressed

- Validation section of PRD
