import type { StoredMessage } from '@/types/stored-message';
import type { TimelineSnapshotSerialized } from '@/types/timeline';
import type { AnalysisResult, HireRecommendation } from '@/types/analysis';
import type { TestSummary } from '@/types/test-results';

// Role status values
export type RoleStatus = 'draft' | 'open' | 'paused' | 'closed';
export const ROLE_STATUSES = ['draft', 'open', 'paused', 'closed'] as const satisfies readonly RoleStatus[];

// Submission status values
export type SubmissionStatus = 'in_progress' | 'submitted' | 'analyzing' | 'analysis_failed' | 'reviewed';
export const SUBMISSION_STATUSES = ['in_progress', 'submitted', 'analyzing', 'analysis_failed', 'reviewed'] as const satisfies readonly SubmissionStatus[];

// Computed candidate status (derived from invite + submission)
export type CandidateStatus = 'invited' | 'started' | 'submitted' | 'reviewed';

// Job Role interface
export interface JobRole {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  status: RoleStatus;
  createdAt: string;
  updatedAt: string;
  questionIds: string[]; // References to attached questions
}

// Invite — the unit of work linking a candidate to a role + question
export interface Invite {
  id: string;
  candidateId: string;
  roleId: string;
  questionId: string;
  inviteCode: string;
  notes?: string;
  createdAt: string;
}

// Submission interface
export interface Submission {
  id: string;
  inviteId?: string | null;
  userId?: string | null;
  questionId?: string | null;
  sandboxId?: string | null;
  status: SubmissionStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  chatMessages?: StoredMessage[];
  snapshots?: TimelineSnapshotSerialized[];
  analysisResult?: AnalysisResult | null;
  hireRecommendation?: HireRecommendation | null;
  hireReasoning?: string | null;
  timeSpent?: string | null;
  timeExceeded?: boolean;
  tokensIn?: number;
  tokensOut?: number;
  messageCount?: number;
  startedAt?: string | null;
  testSummary?: TestSummary | null;
}

// Candidate — person identity only
export interface Candidate {
  id: string;
  name: string;
  email: string;
  notes?: string;
  createdAt: string;
}

// Form input type for create/edit (schema-ready)
export type RoleFormData = Omit<JobRole, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'questionIds'>;

// Activity types for recent activity feed
export type ActivityType = 'role_created' | 'candidate_invited' | 'candidate_submitted' | 'candidate_reviewed' | 'role_status_changed';

export interface Activity {
  id: string;
  type: ActivityType;
  roleId: string;
  candidateId?: string;
  description: string;
  timestamp: string;
}
