# scopedEdit

## Purpose

`src/server/scopedEdit` implements a two-pass, LLM-driven editing workflow that limits edits to a selected subset of files instead of editing an entire file set at once.

This directory is responsible for:

- Choosing which files should be edited for a user request.
- Running content updates only on those selected files.
- Returning a merged result containing both unchanged and updated files.

## Implementation Summary

The module works in two stages:

1. Planning stage: choose target files from available file paths.
2. Editing stage: generate full updated file content for selected files.

The planner and editor both use structured outputs validated with Zod schemas to keep model responses predictable.

## File Reference

### `index.ts`

- Exposes `performScopedEdit(...)`, the orchestration entry point.
- Calls `planFiles(...)` first to decide which files should be edited.
- Filters `currentFiles` down to selected paths only.
- Calls `editFiles(...)` for selected files, then merges updates back into the full file map.

### `planner.ts`

- Implements `planFiles(userMessage, fileNames)`.
- Builds a prompt from the user request and available file list.
- Calls `generateText(...)` with `Output.object(...)` and `plannerOutputSchema`.
- Returns `output.files` (or `[]` fallback).
- Enforces planner constraints through schema/prompt convention (up to 10 files, intended minimum 3).

### `editor.ts`

- Implements `editFiles(userMessage, selectedFiles, model)`.
- Formats selected files into a prompt with full file content blocks.
- Calls `generateText(...)` with caller-provided `model` and `editorOutputSchema`.
- Expects complete file replacements in response (`path` + full `content` per file).
- Returns a `Record<string, string>` map for easy merge by `performScopedEdit(...)`.

### `schemas.ts`

- Defines Zod schemas for planner and editor structured outputs:
- `plannerOutputSchema`: `{ files: string[] }` with max length of 10.
- `editorOutputSchema`: `{ files: Array<{ path: string; content: string }> }`.
- Exports inferred TypeScript types `PlannerOutput` and `EditorOutput`.

## Notes

- Planner currently hardcodes `meta/llama-4-scout`.
- Editor receives its model as a function argument, allowing caller control.
- Logging statements are included in planner/editor for runtime observability.
