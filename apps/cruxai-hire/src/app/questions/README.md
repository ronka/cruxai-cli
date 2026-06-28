# `src/app/questions`

## Purpose

This directory contains the App Router routes for the Questions area of the product.
It covers the full question workflow:
- Browsing and filtering available questions.
- Creating new candidate-defined questions.
- Running an interactive question session for a specific question.
- Viewing post-session analysis and feedback.

In route terms, it defines:
- `/questions`
- `/questions/new`
- `/questions/:id`
- `/questions/:id/analysis`

## File Inventory

- `page.tsx`
  - Route page for `/questions`.
  - Renders the questions index with filters (role and difficulty), merges static and user-added questions, and displays each result with `QuestionCard`.

- `new/page.tsx`
  - Route page for `/questions/new`.
  - Provides the form to create a new candidate question (metadata, requirements, repository/test config, and allowed AI models), validates input, saves to `questionsStore`, and redirects back to the questions list.

- `[id]/page.tsx`
  - Route page for `/questions/:id`.
  - Runs the live question session UI (chat + sandbox preview), starts/ends timed sessions, syncs files/tool calls, persists session data, and navigates to analysis when finished.

- `[id]/analysis/page.tsx`
  - Route page for `/questions/:id/analysis`.
  - Loads session stats, triggers/fetches analysis results, updates token usage, and renders score breakdowns, timeline insights, and loading/error states.

- `[id]/README.md`
  - Local documentation for the `:id` dynamic route directory and its analysis sub-route.

- `README.md`
  - This documentation file for the overall `questions` route directory.
