import type { Question, TimeConstraints } from '@/types/question-shared';
import type { Candidate, Invite } from '@/types/recruiter';

export type QuestionSource = 'static' | 'recruiter_invite';

export interface InviteContext {
  invite: Invite;
  candidate: Pick<Candidate, 'id' | 'name'>;
  roleName: string;
  timeConstraints: TimeConstraints;
}

export type ResolvedQuestionResponse =
  | { source: 'static'; question: Question; invite: null }
  | { source: 'recruiter_invite'; question: Question; invite: InviteContext };

export function isInviteResponse(
  r: ResolvedQuestionResponse
): r is Extract<ResolvedQuestionResponse, { source: 'recruiter_invite' }> {
  return r.source === 'recruiter_invite';
}

export interface InviteResolutionResponse {
  questionId: string;
  source: 'recruiter_invite';
  question: Question;
  invite: InviteContext;
}
