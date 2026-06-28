// User role type for POC
export type UserRole = 'recruiter' | 'candidate';

// Mock user type for POC simulation
export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
}

export type AssessmentStatus = 'not_started' | 'in_progress' | 'submitted' | 'reviewed';

export interface CandidateAssessment {
  id: string;
  questionId: string;
  questionTitle: string;
  roleId: string;
  roleTitle: string;
  companyName: string;
  status: AssessmentStatus;
  assignedAt: string;
  startedAt?: string;
  submittedAt?: string;
  reviewedAt?: string;
  timeLimit: {
    value: number;
    unit: 'minutes' | 'hours';
  };
  hasAnalysis?: boolean;
  feedback?: string;
}
