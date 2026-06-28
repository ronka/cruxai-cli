import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, recruiterProcedure } from '../init';
import { createRoleSchema, updateRoleSchema, updateRoleStatusSchema } from '@/server/validation/roles';
import {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  updateRoleStatus,
  setRoleQuestions,
} from '@/server/services/roles';
import { getQuestionsByIds } from '@/server/services/questions';

export const rolesRouter = router({
  list: recruiterProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(({ ctx, input }) => listRoles({ ownerId: ctx.user.id, status: input?.status })),

  byId: recruiterProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const role = await getRoleById(input.id);
      if (!role) throw new TRPCError({ code: 'NOT_FOUND' });
      if (role.ownerId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      return role;
    }),

  create: recruiterProcedure
    .input(createRoleSchema)
    .mutation(({ ctx, input }) => createRole({ ...input, ownerId: ctx.user.id })),

  update: recruiterProcedure
    .input(z.object({ id: z.string(), data: updateRoleSchema }))
    .mutation(async ({ ctx, input }) => {
      const role = await getRoleById(input.id);
      if (!role) throw new TRPCError({ code: 'NOT_FOUND' });
      if (role.ownerId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      return updateRole(input.id, input.data);
    }),

  delete: recruiterProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const role = await getRoleById(input.id);
      if (!role) throw new TRPCError({ code: 'NOT_FOUND' });
      if (role.ownerId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      await deleteRole(input.id);
    }),

  setStatus: recruiterProcedure
    .input(z.object({ id: z.string(), status: updateRoleStatusSchema.shape.status }))
    .mutation(async ({ ctx, input }) => {
      const role = await getRoleById(input.id);
      if (!role) throw new TRPCError({ code: 'NOT_FOUND' });
      if (role.ownerId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      return updateRoleStatus(input.id, input.status);
    }),

  setQuestions: recruiterProcedure
    .input(z.object({ id: z.string(), questionIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const role = await getRoleById(input.id);
      if (!role) throw new TRPCError({ code: 'NOT_FOUND' });
      if (role.ownerId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      const questions = await getQuestionsByIds(input.questionIds);
      const byId = new Map(questions.map((q) => [q.id, q]));
      for (const questionId of input.questionIds) {
        const question = byId.get(questionId);
        if (!question) throw new TRPCError({ code: 'NOT_FOUND', message: `Question ${questionId} not found` });
        if (!question.isPublic && question.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot assign a private question you do not own' });
        }
      }
      await setRoleQuestions(input.id, input.questionIds);
      return getRoleById(input.id);
    }),
});
