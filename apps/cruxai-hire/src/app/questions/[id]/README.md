# `src/app/questions/[id]`

## Purpose

This directory defines the dynamic question detail route in the Next.js App Router (`/questions/:id`) and its nested analysis route (`/questions/:id/analysis`).

It is responsible for:
- Running an interactive question session (chat, sandbox preview, timer, checkpoints, and session persistence).
- Ending a session and navigating to analysis.
- Rendering and triggering post-session analysis (score, skills breakdown, timeline, and summary metrics).

## File Inventory

- `page.tsx`
  - Main question session page for `/questions/:id`.
  - Loads question data via `GET /api/questions/[id]?invite=<code>`, supporting both static and recruiter-invite flows. When an `?invite` param is present: resolves invite context server-side, redirects if the code maps to a different question ID (`useInviteMismatchRedirect`), and marks the submission as completed on end (`useInviteEndQuestion`). Renders chat + preview panels with the question spec modal.

- `analysis/page.tsx`
  - Analysis results page for `/questions/:id/analysis`.
  - Loads stored session stats, triggers/fetches analysis, updates token usage counters, and renders scoring, skills assessment, timeline, loading/error states, and navigation actions.

- `README.md`
  - Documentation for this route directory, including purpose and per-file responsibilities.
