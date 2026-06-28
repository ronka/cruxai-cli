import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { questionsRouter } from './questions';
import { rolesRouter } from './roles';
import { candidatesRouter } from './candidates';
import { invitesRouter } from './invites';
import { submissionsRouter } from './submissions';
import { analysisRouter } from './analysis';
import { sandboxRouter } from './sandbox';
import { rulesRouter } from './rules';

const healthRouter = router({
  ping: publicProcedure
    .input(z.void())
    .query(() => ({ pong: true, timestamp: new Date() })),
});

export const appRouter = router({
  health: healthRouter,
  questions: questionsRouter,
  roles: rolesRouter,
  candidates: candidatesRouter,
  invites: invitesRouter,
  submissions: submissionsRouter,
  analysis: analysisRouter,
  sandbox: sandboxRouter,
  rules: rulesRouter,
});

export type AppRouter = typeof appRouter;
