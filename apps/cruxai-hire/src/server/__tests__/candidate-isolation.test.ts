import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/services/candidates', () => ({
  listCandidates: vi.fn(),
  getCandidateById: vi.fn(),
  getCandidateByEmail: vi.fn(),
  getPublicCandidatePreview: vi.fn(),
  createCandidate: vi.fn(),
  upsertCandidateByEmail: vi.fn(),
  updateCandidate: vi.fn(),
  deleteCandidate: vi.fn(),
}));

vi.mock('@/server/services/invites', () => ({
  listInvites: vi.fn(),
  getInviteByIdScoped: vi.fn(),
  getInviteByIdPublic: vi.fn(),
  getInviteByCode: vi.fn(),
  createInvite: vi.fn(),
  deleteInvite: vi.fn(),
  InviteForbiddenError: class InviteForbiddenError extends Error {
    constructor(message: string) { super(message); this.name = 'InviteForbiddenError'; }
  },
}));

import * as candidateService from '@/server/services/candidates';
import * as inviteService from '@/server/services/invites';
import type { Candidate, Invite } from '@/types/recruiter';

const OWNER_A = 'recruiter-a';
const OWNER_B = 'recruiter-b';

const aliceForA: Candidate = {
  id: 'alice-a',
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: '2026-01-01T00:00:00Z',
};

const aliceForB: Candidate = {
  id: 'alice-b',
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: '2026-01-01T00:00:00Z',
};

const inviteForA: Invite = {
  id: 'invite-a',
  candidateId: 'alice-a',
  roleId: 'role-a',
  questionId: 'question-a',
  inviteCode: 'CODE-A',
  createdAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('candidate isolation', () => {
  it('two recruiters can each upsert the same email — both succeed with distinct rows', async () => {
    vi.mocked(candidateService.upsertCandidateByEmail)
      .mockResolvedValueOnce({ candidate: aliceForA, created: true })
      .mockResolvedValueOnce({ candidate: aliceForB, created: true });

    const resultA = await candidateService.upsertCandidateByEmail({ name: 'Alice', email: 'alice@example.com', ownerId: OWNER_A });
    const resultB = await candidateService.upsertCandidateByEmail({ name: 'Alice', email: 'alice@example.com', ownerId: OWNER_B });

    expect(resultA.created).toBe(true);
    expect(resultB.created).toBe(true);
    expect(resultA.candidate.id).not.toBe(resultB.candidate.id);
  });

  it('listCandidates as A returns only A\'s rows', async () => {
    vi.mocked(candidateService.listCandidates).mockResolvedValue([aliceForA]);

    const rows = await candidateService.listCandidates({ ownerId: OWNER_A });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('alice-a');
    expect(vi.mocked(candidateService.listCandidates)).toHaveBeenCalledWith({ ownerId: OWNER_A });
  });

  it('getCandidateById as A on B\'s candidate returns null', async () => {
    vi.mocked(candidateService.getCandidateById).mockResolvedValue(null);

    const result = await candidateService.getCandidateById('alice-b', { ownerId: OWNER_A });
    expect(result).toBeNull();
    expect(vi.mocked(candidateService.getCandidateById)).toHaveBeenCalledWith('alice-b', { ownerId: OWNER_A });
  });

  it('updateCandidate as A on B\'s candidate returns null (no mutation)', async () => {
    vi.mocked(candidateService.updateCandidate).mockResolvedValue(null);

    const result = await candidateService.updateCandidate('alice-b', { name: 'Evil Edit' }, { ownerId: OWNER_A });
    expect(result).toBeNull();
  });

  it('deleteCandidate as A on B\'s candidate returns false (no mutation)', async () => {
    vi.mocked(candidateService.deleteCandidate).mockResolvedValue(false);

    const deleted = await candidateService.deleteCandidate('alice-b', { ownerId: OWNER_A });
    expect(deleted).toBe(false);
  });

  it('listInvites as B does not return A\'s invite', async () => {
    vi.mocked(inviteService.listInvites).mockResolvedValue([]);

    const rows = await inviteService.listInvites(OWNER_B);
    expect(rows).toHaveLength(0);
    expect(vi.mocked(inviteService.listInvites)).toHaveBeenCalledWith(OWNER_B);
  });

  it('getInviteByIdScoped as B on A\'s invite returns null', async () => {
    vi.mocked(inviteService.getInviteByIdScoped).mockResolvedValue(null);

    const result = await inviteService.getInviteByIdScoped('invite-a', OWNER_B);
    expect(result).toBeNull();
  });

  it('deleteInvite as B on A\'s invite returns false', async () => {
    vi.mocked(inviteService.deleteInvite).mockResolvedValue(false);

    const deleted = await inviteService.deleteInvite('invite-a', OWNER_B);
    expect(deleted).toBe(false);
  });

  it('createInvite as A with B-owned role throws InviteForbiddenError', async () => {
    const { InviteForbiddenError } = await import('@/server/services/invites');
    vi.mocked(inviteService.createInvite).mockRejectedValue(new InviteForbiddenError('Role not owned by caller'));

    await expect(
      inviteService.createInvite({
        candidateId: 'alice-a',
        roleId: 'role-b',
        questionId: 'question-a',
        inviteCode: 'CODE-X',
        ownerId: OWNER_A,
      })
    ).rejects.toBeInstanceOf(InviteForbiddenError);
  });

  it('getInviteByCode resolves the invite regardless of owner (public candidate flow)', async () => {
    vi.mocked(inviteService.getInviteByCode).mockResolvedValue(inviteForA);

    const result = await inviteService.getInviteByCode('CODE-A');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('invite-a');
  });
});
