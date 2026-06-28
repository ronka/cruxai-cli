# `src/app/recruiters/roles`

## Purpose

This directory contains recruiter-facing role routes in the Next.js App Router.
It covers creating roles, viewing a role dashboard, managing role-linked questions, and editing role-scoped question configurations.

In route terms, this directory handles:
- `/recruiters/roles/new`
- `/recruiters/roles/:roleId`
- `/recruiters/roles/:roleId/questions/:questionId`

## File Inventory

- `new/page.tsx`
  - Route page for `/recruiters/roles/new`.
  - Renders the "Create New Role" flow, initializes question data for selection, submits a new role to `recruiterRolesStore`, and redirects back to the recruiters roles list.

- `[roleId]/page.tsx`
  - Route page for `/recruiters/roles/:roleId`.
  - Displays role details and stats with tabbed views (overview, questions, submissions, candidates), syncs role-linked questions, and supports sending questions to candidates.

- `[roleId]/questions/[questionId]/page.tsx`
  - Route page for `/recruiters/roles/:roleId/questions/:questionId`.
  - Handles create/edit question flows scoped from a role context, including technical/test/evaluation/AI settings, saves question changes, and auto-attaches newly created questions to the current role.

- `README.md`
  - Documentation for this directory and its route file responsibilities.
