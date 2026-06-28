import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './context';

export type SessionUser = { id: string; name: string; email: string; role: string };

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;

export const publicProcedure = t.procedure;

const withSession = t.middleware(async ({ ctx, next }) => {
  const session = await ctx.getSession();
  if (!session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: session.user as SessionUser } });
});

const withRecruiter = withSession.unstable_pipe(({ ctx, next }) => {
  if (ctx.user.role !== 'recruiter') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

export const sessionProcedure = t.procedure.use(withSession);

export const recruiterProcedure = t.procedure.use(withRecruiter);

// Candidate-facing procedures don't require a session; they validate via invite code in their input
export const candidateProcedure = t.procedure;
