# Plan: Rule Engine Cleanup

> Generated from: thermo-nuclear code quality review of commits 8b03cfa..a56ded5 (conversation)
> Date: 2026-06-03

## Overview

The rule-engine feature shipped ~4,000 LOC to surface 9 rules, three of which are silently broken at runtime, with a custom DSL+lexer+parser+interpreter that no current requirement justifies, dead code paths wired into prod, a debug page in `app/`, scoring duplicated across server and client, and feature logic leaking into the chat route. This plan executes the Recommended Path from the review: subtract dead surface, push feature logic back into its owning layer, then replace the DSL with typed `Rule.detect` functions while trimming the `Session` shape to what's actually read. The expected net diff is ~3,000 LOC deleted against ~600 LOC added, with stronger typing, no silent failures, and three previously-broken rules starting to work.

---

## Tasks

### Task 1: Dead-code purge

- **Type**: AFK
- **Blocked by**: None - can start immediately
- Status: done

#### What to build

Remove the surfaces that have no production callers and the duplicate engine singleton. Pure subtraction — no production behavior changes.

Delete:
- `src/app/rule-engine-demo/page.tsx` (debug fixture mounted as a real route)
- `rules.analyze` tRPC mutation and its `sessionRequestSchema` / `sessionSchema` in `src/server/trpc/routers/rules.ts`
- `useAnalyzeSessionMutation` in `src/hooks/api/rules.ts`
- `src/server/actions/analyze-streaming.ts` (uncalled `'use server'` generator)
- The `engine` singleton in `src/lib/rule-engine.server.ts` and `engine.score()` if it remains uncalled

Consolidate so a single engine instance (the one previously named `sessionEngine`, with `skipIdeContextRules: true`) is the only path. If no rule still sets `requiresIdeContext` after this, also drop the `skipIdeContextRules` option from `RuleEngineOptions`.

#### Acceptance criteria

- [ ] `npm run lint` and `npm run build` pass
- [ ] `grep -r useAnalyzeSessionMutation src/` returns nothing
- [ ] `grep -r rule-engine-demo src/` returns nothing
- [ ] Only one `createRuleEngine(...)` call exists in the repo
- [ ] Recruiter submission analysis page renders the same findings/score as before

#### User stories addressed

- Review §4 (delete `rules.analyze` and the demo)
- Review §7 (consolidate the two engine singletons)

---

### Task 2: Chat-route stamping moves into `chat.ts`

- **Type**: AFK
- **Blocked by**: None - can start immediately
- Status: done (reasoning-effort-overuse rule removed; stamping no longer tracks reasoningEffort)

#### What to build

Move the per-message `modelId` / `usage` / `reasoningEffort` stamping out of `src/app/api/chat/route.ts` and into `handleChatRequest` (or a helper it owns) in `src/server/chat.ts`. The route handler becomes a thin pass-through that calls `saveChatMessages(submissionId, event.messages, event.elapsedSeconds)` with already-stamped messages.

Decide on `reasoningEffort` source. The current `enableReasoning ? 'high' : null` is a tautology (it just mirrors the user's toggle, so the `reasoning-effort-overuse` rule reduces to "did the candidate enable reasoning"). Either wire a real per-step reasoning level from the AI SDK, or drop the stamping and remove the `reasoning-effort-overuse` rule until a real signal exists.

Drop the `as { cacheReadInputTokens?: number }` cast in `chat.ts:56` in favor of the AI SDK's own usage type.

#### Acceptance criteria

- [ ] `src/app/api/chat/route.ts` has no `for (let i = stampedMessages.length - 1; ...)` walk-back loop
- [ ] `saveChatMessages` is still called with stamped messages (verified by reading them back in the rule-engine adapter and the rules still produce expected findings)
- [ ] No `as { cacheReadInputTokens?: number }` cast remains in `chat.ts`
- [ ] Decision recorded in commit message: real reasoning signal wired, or `reasoning-effort-overuse` rule removed

#### User stories addressed

- Review §8 (feature logic leaking into the route handler)
- Review §10 (cast soup)

---

### Task 3: Fold `markLastUserAborted` into the next save

- **Type**: AFK
- **Blocked by**: None - can start immediately
- Status: done (stamp on next save via event.isAborted)

#### What to build

The stop button currently fires an extra `trpc.submissions.markLastUserAborted.mutate({ id })` that does a non-atomic read-modify-write of the `chatMessages` JSONB just to set `aborted: true` on one message. Replace that with stamping at the same point we already write messages.

Two acceptable shapes (pick whichever is simpler):

1. **Stamp on next save** — `saveChatMessages` accepts an optional `markLastUserAborted: boolean` and flips the flag on the last user message inside the same write that persists the in-flight transcript.
2. **Derive on read** — Compute `aborted` in `submissionToSession` from the absence of a finalizing assistant response after a user message. No write path needed.

Delete:
- `markLastUserAborted` tRPC procedure in `src/server/trpc/routers/submissions.ts`
- `markLastUserAborted` service function in `src/server/services/submissions.ts`
- The `handleStop` wrapper in `src/app/questions/[id]/page.tsx` (the `ChatInput` `stop` prop goes back to the raw `stop` from the chat hook)

#### Acceptance criteria

- [ ] No `markLastUserAborted` procedure or service function in the repo
- [ ] `src/app/questions/[id]/page.tsx` no longer wraps `stop`
- [ ] Hitting stop during a chat still results in `aborted: true` on the relevant message (verified by reading the submission row after a stopped turn)
- [ ] No extra round-trip from the candidate UI on stop (verified in the network tab)

#### User stories addressed

- Review §9 (non-atomic write + extra round-trip for a flag we could carry along)

---

### Task 4: Scoring server-side, stub filter gone

- **Type**: AFK
- **Blocked by**: None - can start immediately
- Status: done (always-fires deleted; server computes score; panel reads {findings, score} directly)

#### What to build

`analyzeSubmission` returns `{ findings, score }` where `score` is computed server-side via `engine.score(session)`. `RuleFindingsPanel` consumes the score object directly instead of importing `scoreFindings`, `PRACTICE_GROUPS`, `SessionScore`, `Tier` from `@/rule-engine/scoring`. Drop the `data.findings.filter(f => f.ruleId !== 'always-fires')` line in the panel — the server returns the post-filter set.

Choose for `always-fires`:
- **Delete it.** The other rules now exercise the pipeline end-to-end; the tracer bullet has served its purpose.
- **Gate it.** Filter the stub at the engine factory when `process.env.NODE_ENV !== 'development'`.

Recommend deletion.

Memoize the score in the panel only if it remains a derived value; otherwise drop the `recharts` re-derivation hazard.

#### Acceptance criteria

- [ ] `src/components/rule-findings/RuleFindingsPanel.tsx` does not import from `@/rule-engine/scoring`
- [ ] Server response includes `score` and the panel renders it directly
- [ ] No `f.ruleId !== 'always-fires'` filter exists in the client
- [ ] `engine.score()` has at least one production caller (the router)
- [ ] The displayed overall score equals `engine.score(session).overall` for a known submission

#### User stories addressed

- Review §5 (stub filter spaghetti)
- Review §6 (scoring computed twice)

---

### Task 5: Replace DSL with typed `Rule.detect` + trim Session shape + contract tests

- **Type**: AFK
- **Blocked by**: Task 4
- Status: done (DSL/pipeline deleted; 8 rules rewritten as typed detect; Session trimmed; 33 tests pass)

#### What to build

Change `Rule.detectionLogic: string` to `Rule.detect: (session: Session) => RuleFinding | null` (or an equivalent shape that returns `{ count, total, ratio, examples, extra }` and lets `createRuleEngine` finalize the `RuleFinding`). Rewrite the 9 active rules in `src/rules/rules.ts` as typed functions. Reuse `severityFor`, `mkFinding`, and template helpers if a shared shape helps, but prefer direct returns.

This unblocks the broken-rule fixes naturally — `repeated-prompts`, `premium-waste`, and `reasoning-effort-overuse` use `duplicateGroups`, `modelTier`, `normalizeModel` which don't exist; rewriting them as TS functions either makes those helpers real or removes the need.

Delete:
- `src/rule-engine/dsl/` (entire directory: lexer, parser, interpreter, safe-regex, dsl types, index)
- `src/rule-engine/pipeline.ts`
- The `resolveInheritance` function in `src/rule-engine/index.ts` (no rule uses `extends`)
- The pipeline cache in `src/rule-engine/index.ts`
- `Rule.detectionLogic`, `Rule.descriptionTemplate`, `Rule.suggestionTemplate`, `Rule.exampleTemplate`, `Rule.patterns`, `Rule.fileTypes`, `Rule.extends`, `Rule.requiresIdeContext` if unused after the rewrite
- The `as Record<string, unknown>` cast soup in `submissionToSession` for fields `StoredMessage` already declares

Trim `Session` / `SessionRequest` in `src/rule-engine/types.ts` to fields the rewritten rules actually read. The remaining fields will be approximately: `requests`, and per-request `messageText`, `messageLength`, `isCanceled`, `totalElapsed`, `modelId`, `reasoningEffort`, `aiCode`, plus whatever the surviving rules touch. Delete the rest.

Add `src/rule-engine/__tests__/rules.test.ts`:
- For each active rule, a positive fixture that should fire and an asserted finding
- For each active rule, a negative fixture that should not fire and an asserted `null`
- A contract test that asserts every `Rule.id` is unique and every rule's group is in `PRACTICE_GROUPS`

#### Acceptance criteria

- [ ] `src/rule-engine/dsl/` does not exist
- [ ] `src/rule-engine/pipeline.ts` does not exist
- [ ] Every rule in `src/rules/rules.ts` has a typed `detect` function and no `detectionLogic` string
- [ ] `npm run test` covers every active rule with a positive and negative fixture
- [ ] `Session` / `SessionRequest` declare only fields read by at least one active rule
- [ ] `submissionToSession` has no `as { aborted?: boolean }` / `as { modelId?: string }` style casts on `StoredMessage` fields
- [ ] Net diff for the slice is dominated by deletions (target: ≥1,000 LOC removed)
- [ ] Findings produced for a representative submission are unchanged from pre-slice output (modulo the three previously-broken rules now firing correctly)

#### User stories addressed

- Review §1 (delete the DSL — code-judo move)
- Review §2 (dead DSL functions and dead `Session` fields)
- Review §3 (broken rules from missing DSL functions)
- Review §10 (cast soup in `submissionToSession`)

---

### Task 6: Move design docs to `docs/`

- **Type**: AFK
- **Blocked by**: None - can start immediately
- Status: done

#### What to build

CLAUDE.md says design docs live under `docs/` with a creation-date prefix. The rule-engine design landed at the repo root. Move it.

- `RULE_ENGINE_NEXTJS_DESIGN.md` → `docs/2026-06-02-rule-engine-nextjs-design.md`

The three rule-engine `plans/*.md` files stay where they are; the existing `plans/` directory mixes date-prefixed and un-prefixed files, and renaming established plan files is out of scope.

#### Acceptance criteria

- [ ] `RULE_ENGINE_NEXTJS_DESIGN.md` no longer exists at repo root
- [ ] `docs/2026-06-02-rule-engine-nextjs-design.md` exists with the same content
- [ ] No code references the old path
