import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, recruiterProcedure, publicProcedure } from '../init';
import { createQuestionSchema, updateQuestionSchema } from '@/server/validation/questions';
import {
  listQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
} from '@/server/services/questions';
import { resolveQuestion } from '@/server/question-resolver';

export const questionsRouter = router({
  list: recruiterProcedure
    .input(z.object({ status: z.string().optional(), role: z.string().optional(), ownedOnly: z.boolean().optional() }).optional())
    .query(({ ctx, input }) => listQuestions({ ownerId: ctx.user.id, ownedOnly: input?.ownedOnly, status: input?.status, role: input?.role })),

  byId: recruiterProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const question = await getQuestionById(input.id);
      if (!question) throw new TRPCError({ code: 'NOT_FOUND' });
      if (!question.isPublic && question.ownerId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      return question;
    }),

  create: recruiterProcedure
    .input(createQuestionSchema)
    .mutation(({ ctx, input }) => createQuestion({ ...input, ownerId: ctx.user.id })),

  update: recruiterProcedure
    .input(z.object({ id: z.string(), data: updateQuestionSchema }))
    .mutation(async ({ ctx, input }) => {
      const question = await getQuestionById(input.id);
      if (!question) throw new TRPCError({ code: 'NOT_FOUND' });
      if (question.ownerId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      return updateQuestion(input.id, input.data);
    }),

  delete: recruiterProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const question = await getQuestionById(input.id);
      if (!question) throw new TRPCError({ code: 'NOT_FOUND' });
      if (question.ownerId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      await deleteQuestion(input.id);
    }),

  duplicate: recruiterProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => duplicateQuestion(input.id, ctx.user.id)),

  resolve: publicProcedure
    .input(z.object({ id: z.string(), inviteCode: z.string().nullish() }))
    .query(async ({ input }) => {
      const result = await resolveQuestion(input.id, input.inviteCode ?? null);
      if (!result.ok) {
        throw new TRPCError({
          code: result.error.kind === 'not_found' ? 'NOT_FOUND' : 'FORBIDDEN',
          message: result.error.kind === 'invalid_invite' ? result.error.reason : undefined,
        });
      }
      return result.data;
    }),
});
