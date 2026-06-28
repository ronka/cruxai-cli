import { describe, it, expect } from 'vitest';
import { computeInviteStatus, buildPipelineItems } from '@/lib/invite-status';
import type { Submission, Invite, Candidate, JobRole } from '@/types/recruiter';

function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: 's-1',
    status: 'in_progress',
    submittedAt: null,
    reviewedAt: null,
    ...overrides,
  };
}

const baseInvite: Invite = {
  id: 'inv-1',
  candidateId: 'cand-1',
  roleId: 'role-1',
  questionId: 'q-1',
  inviteCode: 'CODE1',
  createdAt: '2026-01-01T00:00:00Z',
};

const baseCandidate: Candidate = {
  id: 'cand-1',
  name: 'Alice',
  email: 'alice@example.com',
  createdAt: '2026-01-01T00:00:00Z',
};

const baseRole: JobRole = {
  id: 'role-1',
  title: 'Engineer',
  description: '',
  ownerId: 'owner-1',
  status: 'open',
  questionIds: ['q-1'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('computeInviteStatus', () => {
  it('returns "invited" when there is no submission', () => {
    expect(computeInviteStatus(undefined)).toBe('invited');
  });

  it('returns "started" when submission has startedAt but no submittedAt', () => {
    const sub = makeSubmission({ startedAt: '2026-01-01T10:00:00Z', submittedAt: null, reviewedAt: null });
    expect(computeInviteStatus(sub)).toBe('started');
  });

  it('returns "submitted" when submission has submittedAt but no reviewedAt', () => {
    const sub = makeSubmission({ submittedAt: '2026-01-01T11:00:00Z', reviewedAt: null });
    expect(computeInviteStatus(sub)).toBe('submitted');
  });

  it('returns "reviewed" when submission has reviewedAt', () => {
    const sub = makeSubmission({ submittedAt: '2026-01-01T11:00:00Z', reviewedAt: '2026-01-02T09:00:00Z' });
    expect(computeInviteStatus(sub)).toBe('reviewed');
  });

  it('returns "invited" when submission exists but has no dates', () => {
    const sub = makeSubmission({ submittedAt: null, reviewedAt: null });
    expect(computeInviteStatus(sub)).toBe('invited');
  });

  it('reviewedAt takes precedence over submittedAt', () => {
    const sub = makeSubmission({ submittedAt: '2026-01-01T11:00:00Z', reviewedAt: '2026-01-02T09:00:00Z' });
    expect(computeInviteStatus(sub)).toBe('reviewed');
  });
});

describe('buildPipelineItems', () => {
  it('returns an empty array when there are no invites', () => {
    expect(buildPipelineItems([], [baseCandidate], [], [baseRole])).toEqual([]);
  });

  it('correctly joins an invite with its candidate and submission', () => {
    const sub = makeSubmission({ inviteId: 'inv-1', submittedAt: '2026-01-01T11:00:00Z' });
    const items = buildPipelineItems([baseInvite], [baseCandidate], [sub]);
    expect(items).toHaveLength(1);
    expect(items[0].invite).toEqual(baseInvite);
    expect(items[0].candidate).toEqual(baseCandidate);
    expect(items[0].status).toBe('submitted');
  });

  it('skips invites with missing candidates', () => {
    const otherInvite = { ...baseInvite, id: 'inv-2', candidateId: 'missing-cand' };
    const items = buildPipelineItems([baseInvite, otherInvite], [baseCandidate], []);
    expect(items).toHaveLength(1);
    expect(items[0].invite.id).toBe('inv-1');
  });

  it('sets status to "invited" when no matching submission exists', () => {
    const items = buildPipelineItems([baseInvite], [baseCandidate], []);
    expect(items[0].status).toBe('invited');
  });

  it('attaches roleName when roles are provided', () => {
    const items = buildPipelineItems([baseInvite], [baseCandidate], [], [baseRole]);
    expect(items[0].roleName).toBe('Engineer');
  });

  it('leaves roleName undefined when role is not found', () => {
    const items = buildPipelineItems([baseInvite], [baseCandidate], [], []);
    expect(items[0].roleName).toBeUndefined();
  });

  it('leaves roleName undefined when roles argument is omitted', () => {
    const items = buildPipelineItems([baseInvite], [baseCandidate], []);
    expect(items[0].roleName).toBeUndefined();
  });

  it('handles multiple invites for the same candidate', () => {
    const invite2 = { ...baseInvite, id: 'inv-2', inviteCode: 'CODE2' };
    const items = buildPipelineItems([baseInvite, invite2], [baseCandidate], []);
    expect(items).toHaveLength(2);
    expect(items.every((i) => i.candidate.id === 'cand-1')).toBe(true);
  });
});
