import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/services/questions', () => ({
  getQuestionById: vi.fn(),
}));
vi.mock('@/server/services/invites', () => ({
  getInviteByCode: vi.fn(),
}));
vi.mock('@/server/services/candidates', () => ({
  getPublicCandidatePreview: vi.fn(),
}));
vi.mock('@/server/services/roles', () => ({
  getRoleById: vi.fn(),
}));

import { resolveQuestion, resolveInviteCode } from '@/server/question-resolver';
import { getQuestionById } from '@/server/services/questions';
import { getInviteByCode } from '@/server/services/invites';
import { getPublicCandidatePreview } from '@/server/services/candidates';
import { getRoleById } from '@/server/services/roles';
import type { Question } from '@/types/question-shared';
import type { Invite, Candidate, JobRole } from '@/types/recruiter';

const mockQuestion: Question = {
  id: 'q-1',
  title: 'Test Question',
  description: 'desc',
  role: 'frontend',
  difficulty: 'medium',
  status: 'published',
  ownerId: 'owner-1',
  isPublic: true,
  repository: { url: 'https://github.com/test/repo', startingBranch: 'main', targetBranch: 'solution' },
  aiPermissions: { allowedModels: [] },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockInvite: Invite = {
  id: 'inv-1',
  candidateId: 'cand-1',
  roleId: 'role-1',
  questionId: 'q-1',
  inviteCode: 'INVITE123',
  createdAt: '2026-01-01T00:00:00Z',
};

const mockCandidateSafe = {
  id: 'cand-1',
  name: 'Jane Doe',
};

const mockRole: JobRole = {
  id: 'role-1',
  title: 'Frontend Engineer',
  description: '',
  ownerId: 'owner-1',
  status: 'open',
  questionIds: ['q-1'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('resolveQuestion', () => {
  describe('static path (no invite code)', () => {
    it('returns ok:true with source "static" when question exists', async () => {
      vi.mocked(getQuestionById).mockResolvedValue(mockQuestion);

      const result = await resolveQuestion('q-1', null);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected');
      expect(result.data.source).toBe('static');
      expect(result.data.question).toEqual(mockQuestion);
    });

    it('returns ok:false not_found when question does not exist', async () => {
      vi.mocked(getQuestionById).mockResolvedValue(null);

      const result = await resolveQuestion('q-missing', null);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected');
      expect(result.error.kind).toBe('not_found');
    });
  });

  describe('invite path', () => {
    it('returns ok:true with source "recruiter_invite" when all are valid', async () => {
      vi.mocked(getInviteByCode).mockResolvedValue(mockInvite);
      vi.mocked(getQuestionById).mockResolvedValue(mockQuestion);
      vi.mocked(getPublicCandidatePreview).mockResolvedValue(mockCandidateSafe);
      vi.mocked(getRoleById).mockResolvedValue(mockRole);

      const result = await resolveQuestion('q-1', 'INVITE123');
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected');
      expect(result.data.source).toBe('recruiter_invite');
      expect(result.data.question).toEqual(mockQuestion);
      expect(result.data.invite?.candidate.name).toBe('Jane Doe');
      expect(result.data.invite?.roleName).toBe('Frontend Engineer');
    });

    it('does not expose notes in the candidate-facing invite payload', async () => {
      vi.mocked(getInviteByCode).mockResolvedValue(mockInvite);
      vi.mocked(getQuestionById).mockResolvedValue(mockQuestion);
      vi.mocked(getPublicCandidatePreview).mockResolvedValue(mockCandidateSafe);
      vi.mocked(getRoleById).mockResolvedValue(mockRole);

      const result = await resolveQuestion('q-1', 'INVITE123');
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected');
      const payload = JSON.stringify(result.data.invite?.candidate);
      expect(payload).not.toContain('notes');
    });

    it('returns invalid_invite when invite code does not exist', async () => {
      vi.mocked(getInviteByCode).mockResolvedValue(null);

      const result = await resolveQuestion('q-1', 'BAD_CODE');
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected');
      expect(result.error.kind).toBe('invalid_invite');
    });

    it('returns invalid_invite when candidate is missing', async () => {
      vi.mocked(getInviteByCode).mockResolvedValue(mockInvite);
      vi.mocked(getQuestionById).mockResolvedValue(mockQuestion);
      vi.mocked(getPublicCandidatePreview).mockResolvedValue(null);
      vi.mocked(getRoleById).mockResolvedValue(mockRole);

      const result = await resolveQuestion('q-1', 'INVITE123');
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unexpected');
      expect(result.error.kind).toBe('invalid_invite');
    });

    it('uses invite.questionId over the passed questionId when present', async () => {
      const inviteWithDifferentQuestion = { ...mockInvite, questionId: 'q-from-invite' };
      vi.mocked(getInviteByCode).mockResolvedValue(inviteWithDifferentQuestion);
      vi.mocked(getQuestionById).mockResolvedValue(mockQuestion);
      vi.mocked(getPublicCandidatePreview).mockResolvedValue(mockCandidateSafe);
      vi.mocked(getRoleById).mockResolvedValue(null);

      await resolveQuestion('q-passed', 'INVITE123');
      expect(getQuestionById).toHaveBeenCalledWith('q-from-invite');
    });

    it('applies default time constraints when question has none', async () => {
      const questionNoConstraints = { ...mockQuestion, timeConstraints: undefined };
      vi.mocked(getInviteByCode).mockResolvedValue(mockInvite);
      vi.mocked(getQuestionById).mockResolvedValue(questionNoConstraints);
      vi.mocked(getPublicCandidatePreview).mockResolvedValue(mockCandidateSafe);
      vi.mocked(getRoleById).mockResolvedValue(mockRole);

      const result = await resolveQuestion('q-1', 'INVITE123');
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected');
      expect(result.data.invite?.timeConstraints).toEqual({ limit: 60, unit: 'minutes', hardStop: false });
    });

    it('uses question timeConstraints when present', async () => {
      const questionWithConstraints = { ...mockQuestion, timeConstraints: { limit: 90, unit: 'minutes' as const, hardStop: true } };
      vi.mocked(getInviteByCode).mockResolvedValue(mockInvite);
      vi.mocked(getQuestionById).mockResolvedValue(questionWithConstraints);
      vi.mocked(getPublicCandidatePreview).mockResolvedValue(mockCandidateSafe);
      vi.mocked(getRoleById).mockResolvedValue(mockRole);

      const result = await resolveQuestion('q-1', 'INVITE123');
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('unexpected');
      expect(result.data.invite?.timeConstraints).toEqual({ limit: 90, unit: 'minutes', hardStop: true });
    });
  });
});

describe('resolveInviteCode', () => {
  it('delegates to resolveQuestion and returns invite data', async () => {
    vi.mocked(getInviteByCode).mockResolvedValue(mockInvite);
    vi.mocked(getQuestionById).mockResolvedValue(mockQuestion);
    vi.mocked(getPublicCandidatePreview).mockResolvedValue(mockCandidateSafe);
    vi.mocked(getRoleById).mockResolvedValue(mockRole);

    const result = await resolveInviteCode('INVITE123');
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unexpected');
    expect(result.data.source).toBe('recruiter_invite');
    expect(result.data.questionId).toBe(mockQuestion.id);
  });

  it('propagates errors from resolveQuestion', async () => {
    vi.mocked(getInviteByCode).mockResolvedValue(null);

    const result = await resolveInviteCode('BAD_CODE');
    expect(result.ok).toBe(false);
  });

  it('rejects non-invite results', async () => {
    vi.mocked(getInviteByCode).mockResolvedValue(null);
    const result = await resolveInviteCode('ANY');
    expect(result.ok).toBe(false);
  });
});
