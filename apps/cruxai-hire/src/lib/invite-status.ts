import type { CandidateStatus, Invite, Submission, Candidate, JobRole } from '@/types/recruiter';
import type { InvitePipelineItem } from '@/types/pipeline';

export function computeInviteStatus(submission: Submission | undefined): CandidateStatus {
  if (!submission) return 'invited';
  if (submission.reviewedAt) return 'reviewed';
  if (submission.submittedAt) return 'submitted';
  if (submission.startedAt) return 'started';
  return 'invited';
}

export function buildPipelineItems(
  invites: Invite[],
  candidates: Candidate[],
  submissions: Submission[],
  roles?: JobRole[]
): InvitePipelineItem[] {
  const candidateMap = new Map(candidates.map((c) => [c.id, c]));
  const submissionByInvite = new Map(submissions.map((s) => [s.inviteId, s]));
  const roleMap = roles ? new Map(roles.map((r) => [r.id, r])) : new Map<string, JobRole>();

  const items: InvitePipelineItem[] = [];
  for (const invite of invites) {
    const candidate = candidateMap.get(invite.candidateId);
    if (!candidate) continue;
    const submission = submissionByInvite.get(invite.id);
    const status = computeInviteStatus(submission);
    const roleName = roleMap.get(invite.roleId)?.title;
    items.push({ invite, candidate, status, roleName });
  }
  return items;
}
