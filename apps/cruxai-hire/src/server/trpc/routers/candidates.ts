import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, recruiterProcedure } from '../init';
import { createCandidateSchema, updateCandidateSchema } from '@/server/validation/candidates';
import {
  listCandidates,
  getCandidateById,
  upsertCandidateByEmail,
  updateCandidate,
  deleteCandidate,
} from '@/server/services/candidates';

export const candidatesRouter = router({
  list: recruiterProcedure
    .query(({ ctx }) => listCandidates({ ownerId: ctx.user.id })),

  byId: recruiterProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const candidate = await getCandidateById(input.id, { ownerId: ctx.user.id });
      if (!candidate) throw new TRPCError({ code: 'NOT_FOUND' });
      return candidate;
    }),

  create: recruiterProcedure
    .input(createCandidateSchema)
    .mutation(({ input, ctx }) => upsertCandidateByEmail({ ...input, ownerId: ctx.user.id })),

  update: recruiterProcedure
    .input(z.object({ id: z.string(), data: updateCandidateSchema }))
    .mutation(async ({ input, ctx }) => {
      const candidate = await updateCandidate(input.id, input.data, { ownerId: ctx.user.id });
      if (!candidate) throw new TRPCError({ code: 'NOT_FOUND' });
      return candidate;
    }),

  delete: recruiterProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await deleteCandidate(input.id, { ownerId: ctx.user.id });
      if (!deleted) throw new TRPCError({ code: 'NOT_FOUND' });
    }),
});
