# server

## Purpose

`src/server` contains server-side orchestration for the coding interview flow:

- Chat request handling and model initialization.
- Prompt construction for coding assistance and post-session analysis.
- Tool definitions used by the agent to inspect/update project files.
- Structured schemas for analysis output validation.
- Scoped edit utilities that limit LLM edits to selected files.

## Implementation Notes

- Runtime validation uses Zod schemas to keep LLM/tool responses structured.
- Chat flow delegates to `createChatAgent(...)` and streams UI responses.
- Tool handlers are thin wrappers around in-memory file maps and sandbox writes.
- Scoped edit uses a two-pass pipeline (plan files, then edit files).

## File Reference

### Top-level files

- `analysisSchema.ts`: Defines analysis response contracts (skill scores, level fit, message insights) with Zod and exports inferred TypeScript types.
- `chat.ts`: Exposes `handleChatRequest(...)`; resolves API key/model config, builds gateway model, enables reasoning when supported, and returns streaming agent responses.
- `prompts.ts`: Builds prompt text for chat (`getSystemPrompt`) and interview analysis (`getAnalysisPrompt`) from question/session context and system events.
- `question-resolver.ts`: Resolves questions by ID or invite code. `resolveQuestion(questionId, inviteCode)` handles both static and recruiter-invite flows. `resolveInviteCode(code)` maps an invite code directly to its candidate + question + role — used by `GET /api/invite/[code]`.
- `tools.ts`: Defines `listFiles`, `readFiles`, and `updateCode` tools; `updateCode` writes through `@vercel/sandbox` (with path normalization) and returns status for client sync.

### `scopedEdit` submodule

- `scopedEdit/index.ts`: Orchestrates scoped edit execution via `performScopedEdit(...)`; plans target files, edits selected content, and merges updates with unchanged files.
- `scopedEdit/planner.ts`: Implements file-selection pass using `generateText(...)` and `plannerOutputSchema` to return file paths to modify.
- `scopedEdit/editor.ts`: Implements edit pass; prompts the model with selected file contents and returns full updated file contents keyed by path.
- `scopedEdit/schemas.ts`: Defines Zod output schemas and inferred types for planner/editor structured outputs.
- `scopedEdit/README.md`: Local module documentation for the scoped edit pipeline and per-file behavior.
