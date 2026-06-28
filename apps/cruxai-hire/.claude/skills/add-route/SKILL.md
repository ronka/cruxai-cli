---
name: add-route
description: Add a new tRPC procedure (route) to the cruxai app — including the router procedure, hook, and any required Zustand store coordination. Use when the user wants to add a new API endpoint, data fetching hook, or server mutation.
---

# Add Route

Add a new typed tRPC procedure end-to-end: router procedure → hook → (optional) Zustand store sync.

## Architecture rules

- **All domain data goes through tRPC.** Never create a new file under `src/app/api/` unless the response must stream (like `/api/chat`) or is managed by an external library (like `/api/auth`).
- `src/server/trpc/routers/` holds thin routers. Business logic belongs in `src/server/*.ts` service modules.
- `src/hooks/api/` holds the consuming hooks. One file per domain (e.g. `roles.ts`, `questions.ts`).
- `useTRPC()` → `queryOptions()` / `mutationOptions()` for React Query-managed calls.
- `useTRPCClient()` → `.procedure.mutate()` / `.procedure.query()` for imperative calls inside `mutationFn` or event handlers.

## Step-by-step

### 1. Identify the domain and auth level

Determine which router owns this procedure and which middleware it needs:

| Who calls it | Middleware to use |
|---|---|
| Recruiter (authenticated) | `recruiterProcedure` |
| Candidate or unauthenticated | `publicProcedure` |

If the domain doesn't have a router yet, create `src/server/trpc/routers/<domain>.ts` and register it in `src/server/trpc/routers/_app.ts`.

### 2. Write the router procedure

```ts
// src/server/trpc/routers/things.ts
import { z } from 'zod';
import { router, recruiterProcedure, publicProcedure } from '../init';
import { listThings, createThing } from '@/server/things';

export const thingsRouter = router({
  // Query (read)
  list: recruiterProcedure
    .input(z.object({ filter: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      return listThings({ ownerId: ctx.user.id, filter: input.filter });
    }),

  // Mutation (write)
  create: recruiterProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      return createThing({ name: input.name, ownerId: ctx.user.id });
    }),
});
```

If business logic is non-trivial, extract it into `src/server/things.ts` and call it from the router.

### 3. Register the router (if new)

```ts
// src/server/trpc/routers/_app.ts
import { thingsRouter } from './things';

export const appRouter = router({
  // ... existing routers
  things: thingsRouter,
});
```

### 4. Write the hook

**For React Query-managed calls** (standard pattern):

```ts
// src/hooks/api/things.ts
'use client';
import { useTRPC } from '@/lib/trpc/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useThingsQuery(filter?: string) {
  const trpc = useTRPC();
  return useQuery(trpc.things.list.queryOptions({ filter }));
}

export function useCreateThingMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.things.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(trpc.things.list.queryFilter()),
    })
  );
}
```

**For imperative calls** (inside `mutationFn`, event handlers, or hooks that chain async operations):

```ts
// src/hooks/things/useThingAction.ts
'use client';
import { useMutation } from '@tanstack/react-query';
import { useTRPCClient } from '@/lib/trpc/trpc';
import { useThingsStore } from '@/stores/thingsStore';

export function useThingAction() {
  const trpc = useTRPCClient();
  const updateThing = useThingsStore((state) => state.updateThing);

  return useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      return trpc.things.update.mutate(input);
    },
    onSuccess: (data) => {
      // Sync Zustand store after tRPC call
      updateThing(data.id, data);
    },
  });
}
```

### 5. Zustand store sync (when needed)

If the mutation result needs to be reflected in client-side UI state immediately (e.g. sandbox files, editor state), sync via `onSuccess`:

```ts
onSuccess: (data) => {
  useThingsStore.getState().updateThing(data.id, data);
}
```

Never duplicate server data in Zustand if React Query cache is sufficient.

### 6. Error mapping reference

| Situation | tRPC error code |
|---|---|
| Missing/invalid session | `UNAUTHORIZED` |
| Wrong role / not owner | `FORBIDDEN` |
| Resource not found | `NOT_FOUND` |
| Invalid input (beyond Zod) | `BAD_REQUEST` |
| Upstream service failure | `INTERNAL_SERVER_ERROR` |
| Resource expired/gone | `PRECONDITION_FAILED` |

```ts
import { TRPCError } from '@trpc/server';
throw new TRPCError({ code: 'NOT_FOUND', message: 'Thing not found' });
```

### 7. Verify

- `npm run build` — no TypeScript errors
- `npm run lint` — no lint errors
- Smoke test: call the hook from a component or page and confirm the round-trip works
