# `src/app/recruiters/submissions`

## Purpose

This directory contains recruiter-facing submission analysis routes.
It is responsible for rendering detailed review pages for individual candidate submissions, including submission metadata, score display, timeline visualization, and skill-level assessment summaries.

In route terms, this directory handles:
- `/recruiters/submissions/:submissionId`

## File Inventory

- `[submissionId]/page.tsx`
  - Dynamic submission detail page for `/recruiters/submissions/:submissionId`.
  - Loads submission/question/role data, handles "not found" states, and renders the analysis UI (status badge, score, metrics cards, chat timeline, skills breakdown, and level assessment) using current mock analysis data.

- `README.md`
  - Documentation for this directory and the responsibilities of its files.
