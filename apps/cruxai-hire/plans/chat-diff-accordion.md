# Plan: Chat Diff Accordion

> Generated from: docs/2026-04-08-chat-diff-accordion.md
> Date: 2026-04-08

## Overview

Enhance the chat interface's file update indicators to be collapsible accordions that show a unified inline code diff when expanded. Each file update becomes a clickable section; expanding it reveals green-highlighted additions and red-highlighted deletions computed from the previous and new file content.

---

## Tasks

### Task 1: Capture previous file content in tool output

- **Type**: AFK
- **Blocked by**: None - can start immediately

#### What to build

Modify `createUpdateCodeTool` in `src/server/tools.ts` so that before writing the new file content to the sandbox, it reads the current file content via `sandbox.readFile()` (using the existing `streamToString` helper from `src/lib/sandbox.ts`). Return `previousCode` alongside `filePath`, `code`, and `success` in the tool output. If the file doesn't exist yet, set `previousCode` to an empty string.

#### Acceptance criteria

- [x] `createUpdateCodeTool` reads the existing file content before calling `sandbox.writeFiles()`
- [x] Tool output includes `previousCode` (string) in all success and error responses
- [x] When the file does not yet exist, `previousCode` is an empty string (no thrown error)
- [x] No regression in existing file-write behavior or `useToolCallFileSync` sync logic

#### User stories addressed

- Diff Source (PRD section "Design Decisions > 1. Diff Source")

---

### Task 2: Collapsible diff accordion in chat UI

- **Type**: AFK
- **Blocked by**: Task 1

#### What to build

Replace the static status line in `UpdateCodePart` (`src/components/question/ChatPanel.tsx`) with a Radix `Collapsible` component. The trigger shows the existing file icon + path with a chevron indicator. The content computes a unified inline diff from `previousCode` and `code` using the `text-diff` library (already installed) and renders it in a scrollable monospace block with green background for additions and red background for deletions. The accordion is closed by default. While the tool is still streaming, show the existing spinner + "Updating..." text without the collapsible wrapper.

#### Acceptance criteria

- [x] Completed file updates render as a clickable collapsible row with a chevron
- [x] Clicking the row toggles open/closed; default state is closed
- [x] Expanded view shows a unified inline diff with green bg for additions, red bg for deletions
- [x] Diff is rendered in monospace text inside a scrollable container
- [x] In-progress state (`input-streaming` / `input-available`) still shows the spinner and "Updating..." text
- [x] Error state still shows the red error indicator
- [x] No syntax highlighting — plain diff coloring only
- [x] Collapsible uses Radix `Collapsible` directly (no context provider pattern)

#### User stories addressed

- Diff Rendering (PRD section "Design Decisions > 2. Diff Rendering")
- Collapsible Pattern (PRD section "Design Decisions > 3. Collapsible Pattern")
- Default State (PRD section "Design Decisions > 4. Default State")
- Syntax Highlighting (PRD section "Design Decisions > 5. Syntax Highlighting")
