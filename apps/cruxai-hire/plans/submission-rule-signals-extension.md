# Plan: Extending Submission to Carry Rule-Engine Signals

> Generated from: docs/2026-06-02-submission-rule-signals-extension.md
> Date: 2026-06-02

## Overview

The rule engine in `src/rule-engine` was ported from a richer IDE-telemetry source and expects ~20 fields per request, but `src/server/services/rule-engine-adapter.ts` only populates 5 of them from a `Submission`. As a result only the `prompt-quality` group can fire on the recruiter submission view. This plan extends the captureable subset end-to-end (signal source → `StoredMessage` → adapter → rule engine → findings panel), one rule-group at a time, and deletes the rules whose required signals have no source in the candidate UX. See the source PRD for the full per-field analysis (§3), schema strategy (§4 — Strategy A: per-message metadata), and rule-by-rule impact (§6).

---

## Tasks

### Task 1: Delete 4 inert rules

- **Type**: AFK
- **Blocked by**: None — can start immediately

#### What to build

Remove the four rules from `src/rules/rules.ts` whose required signals cannot be captured from candidate sessions (PRD §2.1, §6 "Rules to drop outright"):

1. `yolo-mode` (code-review) — needs `toolConfirmations`
2. `auto-approve-terminal` (code-review) — needs `toolConfirmations` + terminal tool
3. `no-slash-commands` (tool-mastery) — needs `slashCommand`
4. `no-custom-instructions` (context-management) — needs `customInstructions`

Update the "Dropped rules" comment block at the top of `rules.ts` to record each removal and its reason, so the decision is discoverable next to the rules. Do **not** stub or feature-flag — delete outright (PRD §2.1 principle 2).

#### Acceptance criteria

- [x] Four rule entries removed from `rules.ts`
- [x] "Dropped rules" comment block updated with each rule name and reason
- [x] `npm run lint` and `npm run build` pass
- [ ] Findings panel on `/recruiters/submissions/{id}` still renders (no runtime error from missing rules)

Status: done

#### User stories addressed

- §2.1 principle 2 (inert rules leave the codebase)
- §6 Rules to drop outright (1–4)

---

### Task 2: Derive tool/file/code signals from existing chatMessages parts

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Extend `submissionToSession` in `src/server/services/rule-engine-adapter.ts` to walk each assistant message's `parts` array and populate previously-empty fields on `SessionRequest`:

- `toolsUsed` — names of `tool-*` parts on the assistant response
- `editedFiles` — `filePath` from each `tool-updateCode` part input
- `referencedFiles` — `paths` from each `tool-readFiles` part input
- `aiCode` — LoC per language, computed from `updateCode` `code` strings (language inferred from `filePath` extension)

No schema change required — this is pure derivation from data already persisted in `chatMessages` (jsonb). This is a vertical slice: existing data → updated adapter → existing rule engine → existing findings panel; after merge the recruiter view should show new findings.

#### Acceptance criteria

- [x] Adapter populates `toolsUsed`, `editedFiles`, `referencedFiles`, `aiCode` for every `SessionRequest`
- [ ] `vibe-coding` rule fires on a submission with sufficient AI-generated code from few prompts (verified manually on a real submission)
- [ ] `code-review` group becomes visible in `RuleFindingsPanel` when conditions are met
- [x] Language inference handles at least: `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.css`, `.html`, `.json`
- [x] Unknown file extensions don't crash the adapter

Status: done

#### User stories addressed

- §3 fields marked 🟢: `toolsUsed`, `editedFiles`, `referencedFiles`, `aiCode`
- §6 row `vibe-coding` (Today ❌ → After ✅)

---

### Task 3: Stamp modelId and per-turn usage on stored messages

- **Type**: AFK
- **Blocked by**: Task 2

#### What to build

Extend the per-message metadata path so that each assistant message carries the model used and its token usage (PRD §4 Strategy A, §5 capture points):

1. Extend `StoredMessage` in `src/types/stored-message.ts` with optional `modelId?: string` and `usage?: { inputTokens?, outputTokens?, cacheReadTokens?, cacheWriteTokens? }`.
2. In `/api/chat/route.ts`, stamp `modelId` on the trailing user message (or assistant message — whichever matches existing `elapsedSeconds` placement) before `saveChatMessages`.
3. In `chat.ts`, extend `onStepFinish` to attach `step.usage` to the corresponding assistant message id, and flush in `saveChatMessages`.
4. Update `submissionToSession` to read `modelId`, `promptTokens`, `completionTokens`, `cacheReadTokens`, `cacheWriteTokens` from the new fields.

Cache token plumbing depends on what the AI Gateway surfaces uniformly across providers (PRD §8 Open Q #3) — if it's Anthropic-only for now, leave the other providers' values as `null` rather than fabricating zeros.

#### Acceptance criteria

- [x] `StoredMessage` type extended; existing messages without these fields still load
- [x] New submissions persist `modelId` per assistant turn
- [x] New submissions persist token usage per assistant turn (at minimum input/output)
- [x] Adapter reads the new fields onto `SessionRequest`
- [ ] `premium-waste` rule fires on a synthetic premium-model-with-short-prompts submission
- [ ] `tool-mastery` group becomes visible in findings panel
- [ ] Old submissions (without the metadata) still render findings without errors — null usage doesn't break rules

Status: done

#### User stories addressed

- §3 fields 🟢: `modelId`, 🟡: `promptTokens`/`completionTokens`/`cacheReadTokens`/`cacheWriteTokens`
- §6 row `premium-waste` (Today ❌ → After ✅)

---

### Task 4: Stamp reasoningEffort

- **Type**: HITL
- **Blocked by**: Task 3

#### What to build

Decision required first (PRD §8 Open Q #1): keep the current on/off toggle and record `'high' | null`, or extend the reasoning toggle in `ChatInput` to a 3-way enum (`low | medium | high` or `medium | high | max`)?

After the decision:

1. Extend `StoredMessage.reasoningEffort?: 'low' | 'medium' | 'high' | 'max' | null` (or the chosen subset).
2. Update `/api/chat/route.ts` to read `enableReasoning` (or the new value) and stamp it on the corresponding message.
3. If the toggle is extended, update the `ChatInput` UI accordingly.
4. Update `submissionToSession` to pass `reasoningEffort` through.

#### Acceptance criteria

- [x] Decision recorded inline in the plan (and/or in a comment in `rules.ts` near `reasoning-effort-overuse`)
- [x] `reasoningEffort` persisted per assistant turn for new submissions
- [x] Adapter populates `reasoningEffort` on `SessionRequest`
- [ ] `reasoning-effort-overuse` rule fires on a synthetic submission with >50% high/max-effort requests
- [ ] If UI changed: the new control is reachable from the candidate question page and behaves correctly

**Decision**: Keep the existing on/off `enableReasoning` boolean in the UI (no UI changes). Map `enableReasoning=true` → `'high'`, `false` → `null`. `StoredMessage.reasoningEffort` uses the full `'low' | 'medium' | 'high' | 'max' | null` type so the field is ready for a future multi-level toggle.

Status: done

#### User stories addressed

- §3 field 🟢: `reasoningEffort`
- §6 row `reasoning-effort-overuse` (Today ❌ → After ✅)
- §8 Open Q #1

---

### Task 5: Track aborted via stop() wrapper

- **Type**: HITL
- **Blocked by**: Task 3

#### What to build

Decision required first (PRD §8 Open Q #2): should `aborted` live on the **user message** ("this turn was abandoned" — what the rule wants) or the **assistant message** ("this response was cut short" — what UI may want)? Rules want the former; pick one and document.

After the decision:

1. Add `aborted?: boolean` to `StoredMessage` (on the side chosen above).
2. Add a tRPC mutation `submissions.markLastUserAborted` (or `markLastAssistantAborted`) on the existing submissions router. Authorization scoped to the active candidate session.
3. In `src/app/questions/[id]/page.tsx`, wrap the `stop` from `useChat` so it calls the new mutation before invoking the underlying `stop()`.
4. Update `submissionToSession` to pass `aborted` through to `SessionRequest.isCanceled` (replacing the hardcoded `false`).

#### Acceptance criteria

- [x] Decision recorded inline (where `aborted` lives)
- [x] tRPC mutation exists, is auth-scoped, and tested via the hook
- [x] Aborting a streaming response from the candidate UI persists the flag
- [x] Adapter sets `isCanceled` correctly per request
- [ ] `high-cancellation` rule fires when >15% of a session's requests are aborted
- [ ] `session-hygiene` group reflects the new findings

**Decision**: `aborted` lives on the **user message** ("this turn was abandoned").

Status: done

#### User stories addressed

- §3 field 🟡: `isCanceled`
- §6 row `high-cancellation` (Today ❌ → After ✅)
- §8 Open Q #2

---

### Task 6: userCode LoC diffing from TimelineSnapshots

- **Type**: AFK
- **Blocked by**: Task 2

#### What to build

Improve `vibe-coding` accuracy (and any future user-vs-AI-code rule) by computing `userCode` LoC per request from adjacent `TimelineSnapshot`s (PRD §3 row `userCode`, §5 capture points, §7 Phase 3).

1. In `submissionToSession`, walk `submission.snapshots` (existing `TimelineSnapshotSerialized[]`) and for each user→assistant request boundary, diff the snapshots immediately before and after the user turn.
2. Compute LoC added/changed per file (language from extension) attributable to the **candidate** (i.e., changes that happened before the next assistant `updateCode` tool call).
3. Populate `userCode` on `SessionRequest`.

This is non-trivial diffing; only ship if `vibe-coding` accuracy matters enough to justify the plumbing (PRD §7 Phase 3 gate).

#### Acceptance criteria

- [x] `userCode` populated on `SessionRequest` for submissions with snapshots
- [x] `vibe-coding` rule's `aiLoc / userPrompts` ratio is no longer skewed by candidate-authored edits being mis-attributed to AI
- [x] Submissions without snapshots still produce findings (empty `userCode` is fine)

Status: done

#### User stories addressed

- §3 field 🟡: `userCode`
- §6 row `vibe-coding` (accuracy improvement)

---

### Task 7: Resolve no-file-context — reframe or delete

- **Type**: HITL
- **Blocked by**: Task 2

#### What to build

Decision required first (PRD §6 "Rules to reframe"): the original `no-file-context` rule fires when the candidate didn't `@file`-reference a file. Cruxai has no `@file` UX. The closest equivalent — "the AI never had to call `readFiles`" — inverts the signal (AI initiative vs. user initiative) and arguably measures task quality, not prompter quality.

Two paths:

1. **Reframe**: rewrite the rule's `match` clause to the cruxai-native signal (e.g., AI's `readFiles` call count == 0 across the session, or candidate prompt never mentions a file path). Update description and suggestion templates to reflect the inverted semantics. After this, `context-management` group goes live.
2. **Delete**: remove `no-file-context` from `rules.ts` and add it to the "Dropped rules" comment block. After this, `context-management` group is empty and the group header should be hidden in the findings panel.

#### Acceptance criteria

- [x] Decision recorded
- [ ] If reframed: new `match`/templates land in `rules.ts`; rule fires on an appropriate synthetic submission
- [x] If deleted: rule removed, comment block updated, and `RuleFindingsPanel` no longer renders an empty `context-management` group header

**Decision**: Deleted. The `context-management` group is now empty; `RuleFindingsPanel` renders no group headers (findings are flat), so nothing to hide.

Status: done

#### User stories addressed

- §6 "Rules to reframe" `no-file-context`
- §2.1 principle 2 (don't leave inert rules in place)
