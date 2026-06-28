# API Routes

Only three custom API routes exist under `src/app/api/`. All domain logic goes through tRPC.

## Active Routes

| Route | File | Purpose |
|---|---|---|
| `/api/trpc/[trpc]` | `trpc/[trpc]/route.ts` | tRPC fetch handler — all domain procedures (questions, roles, candidates, invites, submissions, analysis, sandbox) |
| `/api/chat` | `chat/route.ts` | Streaming chat via Vercel AI SDK — cannot be a tRPC procedure because it streams raw SSE |
| `/api/auth/[...all]` | `auth/[...all]/route.ts` | better-auth — managed by the auth library |

## Adding New Endpoints

For any new data-fetching or mutation endpoint, add a tRPC procedure to the appropriate router under `src/server/trpc/routers/` and consume it from a hook using `useTRPC()` or `useTRPCClient()`. See `CLAUDE.md` → "Adding a New tRPC Procedure" for the pattern.

Do **not** create new route handlers here unless the endpoint is a streaming response or is managed by an external library.
