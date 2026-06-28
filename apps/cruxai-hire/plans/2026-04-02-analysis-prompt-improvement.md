# Analysis Prompt Improvement & Rerun Script

**Date**: 2026-04-02
**Goal**: Improve red-flag detection in `getAnalysisPrompt` and create a rerun script for fast iteration.

## Problem

Submission `81cb0616-74dc-42ab-a138-000a3d2263f4` contains many red-flag-worthy user messages (e.g., blind copy-paste of error messages with no analysis or action) that were not tagged by the analysis prompt.

Root causes identified:
1. The prompt caps tagging at "10-20% of messages", suppressing valid flags
2. The only red-flag example is narrow ("Just remove the validation")
3. Key red-flag categories are missing entirely (error dumping, over-reliance on AI, etc.)
4. Messages are not numbered in the conversation log, making `messageIndex` referencing fragile

## Part 1: Rerun Script

**File**: `scripts/rerun-analysis.ts`

### Usage
```
tsx scripts/rerun-analysis.ts <submission-id> [--save] [--model <model-id>]
```

### Behavior
- **Direct DB access** via Drizzle — no dev server needed
- Fetches submission by ID, loads associated question, runs the analysis pipeline
- **Default**: prints human-readable formatted output to stdout:
  - Overall score
  - Each tagged message showing: index, original message content, tag(s), reasoning
- **`--save`**: overwrites `analysis_result` in the DB (same as `saveAnalysis`)
- **`--model <model-id>`**: optional model override, defaults to `getDefaultModel()`

### Implementation
- Reuses: `getAnalysisPrompt`, `analysisResponseSchema`, `simplifyMessages`, `snapshotsToSystemMessages`, `getDefaultModel`, `saveAnalysis`
- Loads env from `.env` / `.env.local`
- Connects to DB via existing Drizzle setup (`@/server/db`)

## Part 2: Prompt Changes

**File**: `src/server/prompts.ts` — `getAnalysisPrompt` function

### 2a. Number messages in conversation log

Before:
```
[USER]: pasted error message here
[ASSISTANT]: Here's the fix...
```

After:
```
[#1 USER]: pasted error message here
[#2 ASSISTANT]: Here's the fix...
```

This ensures the LLM can reliably produce correct `messageIndex` values, especially in long conversations.

### 2b. Remove the tagging percentage cap

Remove: "Tag approximately 10-20% of messages (only the most notable ones)"

Replace with: "Tag every message that meets the criteria. Do not skip valid tags to reduce count."

### 2c. Add explicit red-flag subcategories

Expand the red-flag definition with these subcategories and examples:

1. **Blind error dumping** — pasting error messages or stack traces without reading, analyzing, or describing what they tried. Example: "TestingLibraryElementError: Unable to find an accessible element with the role 'textbox'" (just the error, no context or action)

2. **Over-reliance on AI** — asking the AI to do all the work with zero independent effort or context. Example: "fix it", "make it work", "do the whole thing"

3. **Ignoring previous guidance** — repeating the same mistake or question that was already addressed in an earlier exchange

4. **No debugging attempt** — not trying to read the error, check relevant code, or narrow down the problem before asking for help

### 2d. Keep unchanged
- **Exemplar** tag definition — no changes
- **Teaching-moment** tag definition — no changes
- **Scoring guidelines** (0-100) — independent from tag counts, no changes
- **Overall prompt structure** — same sections, same output schema

## Validation

1. Run `tsx scripts/rerun-analysis.ts 81cb0616-74dc-42ab-a138-000a3d2263f4` with the **old** prompt to capture baseline
2. Apply prompt changes
3. Rerun to compare — verify red-flag messages are now tagged
4. When satisfied, run with `--save` to persist
