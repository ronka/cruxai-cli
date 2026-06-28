import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, recruiterProcedure, publicProcedure } from '../init';
import { createInviteSchema } from '@/server/validation/invites';
import {
  listInvites,
  createInvite,
  getInviteByCode,
  getInviteByIdScoped,
  getInviteByIdPublic,
  deleteInvite,
  InviteForbiddenError,
} from '@/server/services/invites';
import {
  getInProgressSubmissionByInviteId,
  getSubmissionByInviteId,
  createSubmissionFromInvite,
} from '@/server/services/submissions';
import { resolveInviteCode } from '@/server/question-resolver';

export const invitesRouter = router({
  list: recruiterProcedure
    .input(z.object({
      candidateId: z.string().optional(),
      roleId: z.string().optional(),
      questionId: z.string().optional(),
    }).optional())
    .query(({ input, ctx }) => listInvites(ctx.user.id, input)),

  create: recruiterProcedure
    .input(createInviteSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await createInvite({ ...input, ownerId: ctx.user.id });
      } catch (err) {
        if (err instanceof InviteForbiddenError) {
          throw new TRPCError({ code: 'FORBIDDEN', message: err.message });
        }
        throw err;
      }
    }),

  delete: recruiterProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deleted = await deleteInvite(input.id, ctx.user.id);
      if (!deleted) throw new TRPCError({ code: 'NOT_FOUND' });
    }),

  // Recruiter: fetch invite by UUID (for recruiter invite management UI)
  byId: recruiterProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const invite = await getInviteByIdScoped(input.id, ctx.user.id);
      if (!invite) throw new TRPCError({ code: 'NOT_FOUND' });
      return invite;
    }),

  // Public: resolve full question/invite context by invite code (candidate landing page)
  byCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const result = await resolveInviteCode(input.code);
      if (!result.ok) {
        throw new TRPCError({
          code: result.error.kind === 'not_found' ? 'NOT_FOUND' : 'FORBIDDEN',
          message: result.error.kind === 'invalid_invite' ? result.error.reason : undefined,
        });
      }
      return result.data;
    }),

  // Public: get in-progress session state for an invite code
  session: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const invite = await getInviteByCode(input.code);
      if (!invite) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invite not found' });

      const submission = await getInProgressSubmissionByInviteId(invite.id);
      if (!submission || !submission.sandboxId || !submission.startedAt) {
        return { status: 'none' as const };
      }

      return {
        status: 'in_progress' as const,
        submissionId: submission.id,
        chatMessages: submission.chatMessages ?? [],
        sandboxId: submission.sandboxId,
        startedAt: submission.startedAt,
        snapshots: submission.snapshots ?? [],
      };
    }),

  // Public: find or create a submission for an invite (replaces two-step client logic)
  start: publicProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ input }) => {
      const invite = await getInviteByIdPublic(input.inviteId);
      if (!invite) throw new TRPCError({ code: 'NOT_FOUND' });
      const existing = await getSubmissionByInviteId(invite.id);
      if (existing) return { submissionId: existing.id };
      const submission = await createSubmissionFromInvite({
        inviteId: invite.id,
        questionId: invite.questionId,
      });
      return { submissionId: submission.id };
    }),
});
