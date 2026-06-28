import type { Candidate, CandidateStatus, Invite } from '@/types/recruiter';

export interface InvitePipelineItem {
  invite: Invite;
  candidate: Candidate;
  status: CandidateStatus;
  roleName?: string;
}
