import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { after } from 'next/server';
import { router, publicProcedure, sessionProcedure, recruiterProcedure, type SessionUser } from '../init';
import {
  createFromInviteSchema,
  createSubmissionSchema,
  updateSubmissionSchema,
  updateSubmissionStatusSchema,
  submitSessionSchema,
  saveAnalysisSchema,
} from '@/server/validation/submissions';
import {
  listSubmissionsForViewer,
  listSubmissionsByInviteId,
  getSubmissionById,
  createSubmissionFromInvite,
  createSubmissionForUser,
  updateSubmission,
  updateSubmissionStatus,
  submitWithSession,
  saveAnalysis,
} from '@/server/services/submissions';
import { assertCanReadSubmission, assertCanMutateSubmission } from '@/server/services/submission-access';
import { runBackgroundAnalysis } from '@/server/runBackgroundAnalysis';
import { runBackgroundTests } from '@/server/runBackgroundTests';
import { runBackgroundHireRecommendation } from '@/server/runBackgroundHireRecommendation';

export const submissionsRouter = router({
  list: publicProcedure
    .input(z.object({ inviteId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      // Anonymous invite-flow trust path: callers that know the inviteId can read its rows.
      if (input?.inviteId) {
        return listSubmissionsByInviteId(input.inviteId);
      }
      const session = await ctx.getSession();
      if (!session?.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      return listSubmissionsForViewer(session.user.id);
    }),

  byId: sessionProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const submission = await getSubmissionById(input.id);
      if (!submission) throw new TRPCError({ code: 'NOT_FOUND' });
      await assertCanReadSubmission(submission, ctx);
      return submission;
    }),

  create: sessionProcedure
    .input(createSubmissionSchema)
    .mutation(({ ctx, input }) => createSubmissionForUser({ userId: ctx.user.id, questionId: input.questionId })),

  createFromInvite: recruiterProcedure
    .input(createFromInviteSchema)
    .mutation(({ input }) => createSubmissionFromInvite(input)),

  update: publicProcedure
    .input(z.object({ id: z.string(), data: updateSubmissionSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getSubmissionById(input.id);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      const session = await ctx.getSession();
      await assertCanMutateSubmission(existing, { user: session?.user as SessionUser | undefined });
      return updateSubmission(input.id, input.data);
    }),

  updateStatus: publicProcedure
    .input(z.object({ id: z.string(), status: updateSubmissionStatusSchema.shape.status }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getSubmissionById(input.id);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      const session = await ctx.getSession();
      await assertCanMutateSubmission(existing, { user: session?.user as SessionUser | undefined });
      return updateSubmissionStatus(input.id, input.status);
    }),

  submitSession: publicProcedure
    .input(z.object({ id: z.string(), data: submitSessionSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getSubmissionById(input.id);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      const session = await ctx.getSession();
      await assertCanMutateSubmission(existing, { user: session?.user as SessionUser | undefined });
      return submitWithSession(input.id, input.data);
    }),

  submitSessionBackground: publicProcedure
    .input(z.object({ id: z.string(), data: submitSessionSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getSubmissionById(input.id);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      const session = await ctx.getSession();
      await assertCanMutateSubmission(existing, { user: session?.user as SessionUser | undefined });
      const submission = await submitWithSession(input.id, input.data);
      after(() => runBackgroundAnalysis(input.id));
      after(() => runBackgroundTests(input.id));
      after(() => runBackgroundHireRecommendation(input.id));
      return submission;
    }),

  saveAnalysis: publicProcedure
    .input(z.object({ id: z.string(), data: saveAnalysisSchema }))
    .mutation(({ input }) => saveAnalysis(input.id, input.data)),
});
