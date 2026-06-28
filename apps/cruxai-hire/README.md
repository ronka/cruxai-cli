# Crux AI

Crux AI is a technical assessment platform that connects recruiters with engineering candidates. Recruiters create coding questions and manage job roles, while candidates complete timed coding assessments in an AI-assisted sandbox environment. The platform provides automated analysis and scoring of submissions.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript + React 19
- **UI:** shadcn/ui (Radix primitives) + Tailwind CSS
- **State Management:** Zustand (client state) + React Query (server mutations)
- **Code Editor:** Monaco Editor + Vercel Sandbox
- **AI Integration:** Vercel AI SDK

## Getting Started

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the production bundle |
| `npm run start` | Run the production server |
| `npm run lint` | Run ESLint checks |
| `npm run test:analysis` | Run analysis test script |

## Project Structure

```
src/
├── app/          # Next.js App Router pages, layouts, and API route handlers
│   ├── invite/[code]      # "Before You Begin" landing page for candidates
│   └── api/
│       ├── chat/          # AI chat completions
│       ├── invite/[code]  # Invite code resolution endpoint
│       ├── questions/[id] # Question resolution (self-service + invite flow)
│       └── sandbox/       # Sandbox file operations and test runner
├── components/   # Shared UI components (shadcn/Radix wrappers)
├── hooks/        # Custom React hooks (React Query mutations, encapsulated effects)
│   ├── invite-page/       # Hooks for the /invite/[code] landing page
│   └── question-page/     # Hooks for invite mismatch redirect and end-question logic
├── lib/          # Utilities, helpers, and shared client/server logic
├── server/       # Server-only logic (service modules, prompts, AI tooling)
│   └── question-resolver.ts  # Resolves question by ID or invite code for both flows
├── stores/       # Zustand state management stores
├── data/         # Static/mock data for recruiters, candidates, questions, and analysis results
└── types/        # Shared TypeScript type definitions
    └── question-resolved.ts  # ResolvedQuestionCore, InviteContext, ResolvedQuestionResponse
```

## Invite Flow

Recruiters generate a link in the form `/invite/{code}`. The flow is:

1. **`/invite/[code]`** — "Before You Begin" landing page. Resolves invite via `GET /api/invite/[code]`, shows candidate name, role, question title, time limit, assessment guidelines, and a consent checkbox.
2. **Start Assignment** — redirects to `/questions/{id}?invite={code}`.
3. **`/questions/[id]`** — question page re-resolves the invite code server-side on every load via `GET /api/questions/[id]?invite={code}`. If the code maps to a different question ID, the page redirects to the correct URL.
4. **End Question** — marks the submission as `completed` in `recruiterSubmissionsStore`. The recruiter view loads mock analysis data from `src/data/mock-analysis.ts`.

The invite code travels in the URL — no client-side storage needed. If `?invite` is absent, the question page works as the self-service flow against static questions.

## Question Resolution

`src/server/question-resolver.ts` handles both flows:

- **Self-service:** resolves against `staticQuestions` in `src/data/questions.ts`
- **Recruiter invite:** validates invite code, returns question + `InviteContext` with candidate info, role name, and time constraints

The question page uses React Query (`useQuestionById`) as its single data source.

## Root Files

| File | Description |
|------|-------------|
| `package.json` | Project dependencies, scripts, and metadata |
| `next.config.mjs` | Next.js configuration (strict mode, typed routes) |
| `tsconfig.json` | TypeScript compiler options with `@/*` path aliases |
| `tailwind.config.ts` | Tailwind CSS theme configuration (custom colors, animations, fonts) |
| `postcss.config.js` | PostCSS plugin configuration for Tailwind and Autoprefixer |
| `eslint.config.js` | ESLint flat config with TypeScript and React hooks rules |
| `components.json` | shadcn/ui component configuration and alias mappings |
| `CLAUDE.md` | Repository guidelines and coding conventions for AI assistants |
| `AGENTS.md` | Agent-specific instructions (mirrors CLAUDE.md) |
| `DB-PLAN.md` | Database schema design plan for Postgres + Prisma migration |
| `useeffect-migration.md` | Tracker for refactoring `useEffect` calls into custom hooks |
| `bun.lockb` | Bun lockfile (alternative package manager artifact) |
| `package-lock.json` | npm dependency lockfile |
| `next-env.d.ts` | Auto-generated Next.js TypeScript declarations |
| `tsconfig.tsbuildinfo` | TypeScript incremental build cache |

## Other Directories

| Directory | Description |
|-----------|-------------|
| `docs/` | Design documents, implementation plans, and architecture reports |
| `scripts/` | Standalone utility scripts (e.g., `test-analysis.mjs`) |
| `public/` | Static assets served at the root (favicon, placeholder image, robots.txt) |
| `node_modules/` | Installed npm dependencies |
