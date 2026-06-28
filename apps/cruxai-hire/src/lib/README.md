# lib

## Purpose

`src/lib` contains shared application utilities and cross-cutting helpers used by both server and client flows.

It provides:

- Model metadata and lookup helpers.
- File tree transformation logic for UI rendering.
- Invite link/code utilities.
- Sandbox file read/normalization helpers.
- Agent construction wrappers.
- Reusable UI utility helpers.
- Mock analysis/session data for debug scenarios.

## Implementation Notes

- Most modules are pure utility layers with minimal side effects.
- Sandbox and agent modules wrap external SDKs (`@vercel/sandbox`, AI SDK) behind small project-specific APIs.
- `mockAnalysisData.ts` provides typed fixtures and conversion helpers for analysis UI testing/debugging.

## File Reference

### Top-level files

- `fileTree.ts`: Builds a nested `FileNode` tree from a flat `Record<path, content>` map; creates folder nodes on demand and recursively sorts children (folders first, then files).
- `invite.ts`: Generates 12-char alphanumeric invite codes (`generateInviteCode`) and builds invite URLs in the form `/invite/{code}` (`buildInviteUrl`), using `window.location.origin` with SSR-safe fallback.
- `mockAnalysisData.ts`: Debug-only mock fixtures for chat messages, analysis results, timeline snapshots, and session stats; includes helpers to convert mock messages into `UIMessage[]`.
- `models.ts`: Defines supported AI model metadata (`id`, label, reasoning support) and exposes `getModelById`/`getDefaultModel` lookup helpers.
- `sandbox.ts`: Normalizes sandbox paths, converts streams to strings across Web/Node stream types, and reads allowed source files from a Vercel sandbox via `find` + per-file reads.
- `utils.ts`: Exposes `cn(...)`, a class-name merge helper combining `clsx` and `tailwind-merge`.

### Subdirectory files

- `agents/chat-agent.ts`: Creates a configured `ToolLoopAgent` with project tools (`listFiles`, `readFiles`, `updateCode`), a 20-step stop condition, and optional Anthropic reasoning settings.
