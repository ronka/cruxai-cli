# `src/app/recruiters`

## Purpose

This directory contains the recruiter-facing App Router routes for the hiring workflow.
It covers role management, question library management, candidate tracking, and submission review.

In route terms, this area handles:
- `/recruiters`
- `/recruiters/roles/new`
- `/recruiters/roles/:roleId`
- `/recruiters/roles/:roleId/questions/:questionId`
- `/recruiters/questions`
- `/recruiters/questions/:questionId` (including `new`)
- `/recruiters/candidates/:candidateId`
- `/recruiters/submissions/:submissionId`

## File Inventory

- `page.tsx`
  - Recruiter dashboard landing page for `/recruiters`.
  - Initializes recruiter stores, shows overview/roles/candidates tabs, supports role filtering and status updates, opens invite-candidate flow, and handles role deletion.

- `candidates/[candidateId]/page.tsx`
  - Candidate detail page for `/recruiters/candidates/:candidateId`.
  - Loads candidate data from stores, supports status updates, shows assigned questions and submissions, and provides CV/notes visibility.

- `questions/page.tsx`
  - Questions Library page for `/recruiters/questions`.
  - Initializes question and role data, provides search/filters, shows question stats, and supports editing or sending a question to candidates.

- `questions/[questionId]/page.tsx`
  - Standalone question editor page for `/recruiters/questions/:questionId`.
  - Handles create/edit/delete for library questions, manages technical/testing/evaluation/AI settings, and updates question-to-role attachments.

- `questions/README.md`
  - Documentation for the `questions` route subtree.

- `roles/new/page.tsx`
  - Create-role page for `/recruiters/roles/new`.
  - Renders role creation form, initializes selectable questions, saves a new role in the store, and redirects back to recruiters home.

- `roles/[roleId]/page.tsx`
  - Role detail page for `/recruiters/roles/:roleId`.
  - Shows role KPIs and tabbed views (overview, questions, submissions, candidates), lets recruiters attach questions to the role, and opens send-to-candidate actions.

- `roles/[roleId]/questions/[questionId]/page.tsx`
  - Role-scoped question editor for `/recruiters/roles/:roleId/questions/:questionId`.
  - Supports creating/editing question configuration in a role context and auto-attaches newly created questions to the current role.

- `roles/README.md`
  - Documentation for the `roles` route subtree.

- `submissions/[submissionId]/page.tsx`
  - Submission review page for `/recruiters/submissions/:submissionId`.
  - Loads submission/question/role context and renders analysis UI including score, timeline, skills breakdown, and level assessment.

- `submissions/README.md`
  - Documentation for the `submissions` route subtree.

- `README.md`
  - This top-level documentation file for the recruiter route directory.
