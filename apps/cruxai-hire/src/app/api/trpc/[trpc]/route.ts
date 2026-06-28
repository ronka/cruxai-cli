import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/routers/_app';
import { createTRPCContext } from '@/server/trpc/context';
import * as Sentry from '@sentry/nextjs';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext(),
    onError: ({ error, path }) => {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        Sentry.captureException(error, { extra: { path } });
      }
      console.error(`tRPC error [${path}]:`, error.message);
    },
  });

export { handler as GET, handler as POST };
