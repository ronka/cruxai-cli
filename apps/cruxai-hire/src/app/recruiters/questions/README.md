# `src/app/recruiters/questions`

## Purpose

This directory contains the recruiter-facing Questions Library routes.
It supports browsing/filtering recruiter questions, opening the question editor, creating new questions, and managing role attachments and question configuration.

In route terms, this directory handles:
- `/recruiters/questions` (questions library list)
- `/recruiters/questions/:questionId` (question editor/details)
- `/recruiters/questions/new` (implemented via the dynamic `:questionId` route when `questionId === "new"`)

## File Inventory

- `page.tsx`
  - Questions Library page for `/recruiters/questions`.
  - Initializes recruiter question/role/candidate store data, provides search and filters, displays question stats and cards, and opens the "Send to candidate" dialog.

- `[questionId]/page.tsx`
  - Dynamic question editor page for `/recruiters/questions/:questionId`.
  - Handles both editing existing questions and creating new ones, manages form state/configuration (repo, framework, tests, metrics, AI permissions), supports role attachment updates, and allows delete for existing questions.

- `README.md`
  - Documentation for this route directory and the responsibilities of its files.
