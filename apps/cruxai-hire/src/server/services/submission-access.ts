import { TRPCError } from '@trpc/server';
import type { Submission } from '@/types/recruiter';
import type { SessionUser } from '@/server/trpc/init';
import { getInviteByIdScoped } from './invites';

// TODO(auth): the auth model around invite-flow submissions is provisional.
// Today, the invite-flow candidate is anonymous and the system trusts knowledge
// of the submissionId (or inviteId) as proof of identity. When invite-flow
// gains real candidate auth, replace these checks with a real identity gate.

type Ctx = { user?: SessionUser };

// Invite-flow submissions are gated by ownership of the invite's role
// (via getInviteByIdScoped), not the question — public questions have no
// owner but are invited against through the recruiter's own role.
export async function assertCanReadSubmission(submission: Submission, ctx: Ctx): Promise<void> {
  if (submission.userId) {
    if (!ctx.user || ctx.user.id !== submission.userId) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return;
  }
  if (submission.inviteId) {
    if (!ctx.user) throw new TRPCError({ code: 'FORBIDDEN' });
    const invite = await getInviteByIdScoped(submission.inviteId, ctx.user.id);
    if (!invite) throw new TRPCError({ code: 'FORBIDDEN' });
    return;
  }
  throw new TRPCError({ code: 'FORBIDDEN' });
}

export async function assertCanMutateSubmission(submission: Submission, ctx: Ctx): Promise<void> {
  if (submission.inviteId) {
    // Anonymous invite-flow candidate; knowledge of submissionId is the trust.
    return;
  }
  if (submission.userId) {
    if (!ctx.user || ctx.user.id !== submission.userId) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return;
  }
  throw new TRPCError({ code: 'FORBIDDEN' });
}
