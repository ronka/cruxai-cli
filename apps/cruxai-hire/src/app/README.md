# `src/app`

This directory is the root of the Next.js App Router for the application.
It defines global app behavior (layout, providers, styles, and fallback pages) and hosts top-level route groups (candidate, recruiter, assessment, questions, settings, and API routes).

## Top-Level Files

- `layout.tsx`: Root layout for the entire app; sets metadata, loads global CSS, wraps all pages in shared providers, and mounts the `Agentation` dev helper in development.
- `providers.tsx`: Client-side provider composition for app-wide context (`NuqsAdapter`, React Query client, theme provider, tooltip provider, and toast systems).
- `globals.css`: Global Tailwind/CSS foundation; defines design tokens (light/dark), base element styles, and utility classes used across routes.
- `page.tsx`: Home route (`/`) that renders the public landing page sections with shared header/footer.
- `not-found.tsx`: Global 404 UI for unresolved routes, with quick actions to return home or browse questions.
- `README.md`: Documentation for the `src/app` directory and its top-level contents.

## Top-Level Route Directories

- `api/`: App Router API handlers for chat, analysis, invite resolution, question resolution, sandbox creation, sandbox file sync, and test execution.
- `assess/`: Legacy candidate invite-code assessment entry flow and shared assessment layout.
- `candidates/`: Candidate dashboard route and assessment overview UI.
- `invite/[code]`: "Before You Begin" landing page for candidates arriving via a recruiter invite link. Resolves invite context from the code, presents assessment info and guidelines, requires consent checkbox, then redirects to the question session.
- `questions/`: Questions browsing, question creation, live question session, and post-session analysis routes.
- `recruiters/`: Recruiter workflow routes for roles, question management, candidates, and submission review.
- `settings/`: User settings route for configuring the Vercel AI Gateway API key.

## Implementation Details

- `api/`: Endpoints are implemented as `route.ts` handlers; `chat` delegates to the server layer, `analysis` uses structured AI output validation, `invite/[code]` resolves an invite code to candidate+question+role context, `questions/[id]` handles both static and invite-scoped question resolution, and sandbox routes handle create/read/write/test operations against Vercel sandbox instances.
- `assess/`: Uses a shared layout plus dynamic route `/assess/[inviteCode]`; the page resolves invite context, hydrates recruiter/candidate state, updates submission status, then redirects candidates into the question session.
- `candidates/`: Client route with `Suspense`; initializes candidate store state, syncs URL tab params, and renders loading skeleton + active/completed assessment views.
- `questions/`: Split across index/new/session/analysis routes; supports filtered listing, question creation, timed chat+sandbox execution for `/questions/:id`, and post-session analysis with token usage and scoring.
- `recruiters/`: Multi-route workflow backed by recruiter stores; covers dashboard tabs, role CRUD and role-scoped question editing, question library editing, candidate detail management, and submission analysis review.
- `settings/`: Client page backed by `useSettingsStore`; persists Vercel AI Gateway API key locally, includes show/hide key UX, save confirmation state, and setup/security guidance.
