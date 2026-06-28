import { getQuestionById } from '@/server/services/questions';
import { getInviteByCode } from '@/server/services/invites';
import { getPublicCandidatePreview } from '@/server/services/candidates';
import { getRoleById } from '@/server/services/roles';
import type { ResolvedQuestionResponse, InviteContext, InviteResolutionResponse } from '@/types/question-resolved';

export type ResolutionError =
  | { kind: 'not_found' }
  | { kind: 'invalid_invite'; reason: string };

export type ResolutionResult =
  | { ok: true; data: ResolvedQuestionResponse }
  | { ok: false; error: ResolutionError };

export type InviteResolutionResult =
  | { ok: true; data: InviteResolutionResponse }
  | { ok: false; error: ResolutionError };

export async function resolveQuestion(questionId: string, inviteCode: string | null): Promise<ResolutionResult> {
  if (inviteCode) {
    const invite = await getInviteByCode(inviteCode);
    if (!invite) {
      return { ok: false, error: { kind: 'invalid_invite', reason: 'Invite code not found' } };
    }

    // invite.questionId takes precedence over the passed questionId when present.
    const resolvedQuestionId = invite.questionId ?? questionId;
    const recruiterQuestion = await getQuestionById(resolvedQuestionId);
    if (!recruiterQuestion) {
      return { ok: false, error: { kind: 'not_found' } };
    }

    const [candidate, role] = await Promise.all([
      getPublicCandidatePreview(invite.candidateId),
      getRoleById(invite.roleId),
    ]);

    if (!candidate) {
      return { ok: false, error: { kind: 'invalid_invite', reason: 'Candidate not found' } };
    }

    const inviteContext: InviteContext = {
      invite,
      candidate,
      roleName: role?.title ?? '',
      timeConstraints: recruiterQuestion.timeConstraints ?? { limit: 60, unit: 'minutes', hardStop: false },
    };

    return {
      ok: true,
      data: {
        source: 'recruiter_invite',
        question: recruiterQuestion,
        invite: inviteContext,
      },
    };
  }

  const dbQuestion = await getQuestionById(questionId);
  if (!dbQuestion) {
    return { ok: false, error: { kind: 'not_found' } };
  }

  return { ok: true, data: { source: 'static', question: dbQuestion, invite: null } };
}

export async function resolveInviteCode(code: string): Promise<InviteResolutionResult> {
  const result = await resolveQuestion('', code);
  if (!result.ok) {
    return result;
  }

  if (result.data.source !== 'recruiter_invite') {
    return { ok: false, error: { kind: 'not_found' } };
  }

  return {
    ok: true,
    data: {
      questionId: result.data.question.id,
      source: 'recruiter_invite',
      question: result.data.question,
      invite: result.data.invite,
    },
  };
}
