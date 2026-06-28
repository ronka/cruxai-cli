# types

## Purpose

`src/types` centralizes shared TypeScript type definitions used across candidate, recruiter, question, testing, and timeline flows.

This directory keeps domain contracts in one place so UI and server code can reuse consistent shapes (status unions, entity interfaces, and helper type guards) without duplicating model definitions.

## Implementation Notes

- Most files export literal-union status types plus interfaces for domain entities.
- `question-shared.ts` is the core cross-domain contract layer and includes type guards.
- `text-diff.d.ts` is a module declaration shim for an external package without local typings.

## File Reference

- `candidate.ts`: Candidate-side assessment/user contracts (`CandidateAssessment`, `MockUser`) and related status/role unions for candidate-facing flows.
- `question-shared.ts`: Shared question model primitives (role, difficulty, framework, test config, AI config, constraints), candidate/recruiter question interfaces, and runtime type guards (`isCandidateQuestion`, `isRecruiterQuestion`).
- `recruiter.ts`: Recruiter-side hiring models for roles, submissions, candidates, and activity feed events; includes `RoleFormData` via `Omit<>` for create/edit form payloads.
- `test-results.ts`: Strongly typed shapes for Jest JSON reporter output plus simplified UI-facing test summary/flattened test models.
- `text-diff.d.ts`: Ambient declaration for `"text-diff"` exposing constructor/options and diff operations (`main`, cleanup methods, `levenshtein`, `prettyHtml`).
- `timeline.ts`: Snapshot timeline contracts used to track AI/manual/revert checkpoints with file-state payloads and linkage metadata.
