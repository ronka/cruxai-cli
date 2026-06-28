import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { v5 as uuidv5 } from 'uuid';
import * as schema from './schema';
import { user as authUser } from '../../lib/auth-schema';
import type { AnalysisResult } from '../../types/analysis';

const SEED_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // URL namespace

function toUuid(legacyId: string): string {
  return uuidv5(legacyId, SEED_NAMESPACE);
}

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log('Seeding database...');

  // Resolve seed owner — use first user in the auth table
  const users = await db.select({ id: authUser.id }).from(authUser).limit(1);
  const seedOwnerId = users[0]?.id;
  if (!seedOwnerId) {
    console.error('No users found — run `npx tsx scripts/seed-user.ts` first');
    process.exit(1);
  }

  // --- Questions ---
  const questionId = toUuid('q-001');
  await db.insert(schema.questions).values({
    id: questionId,
    title: 'Extend Monday board to add estimations column with shorthand normalization',
    description: 'Extend an existing Monday.com-style board by adding an estimations column that accepts and normalizes shorthand time notation.',
    role: 'frontend',
    difficulty: 'medium',
    status: 'published',
    repositoryUrl: 'https://github.com/ronka/cruxai-monday-question.git',
    startingBranch: 'main',
    targetBranch: 'solution',
    timeLimitValue: 60,
    timeLimitUnit: 'minutes',
    hardStop: false,
    allowedModels: [],
    ownerId: seedOwnerId,
    isPublic: false,
  }).onConflictDoNothing();

  // --- Public Monday Question (visible to all authenticated users) ---
  const publicQuestionId = toUuid('q-public-monday');
  await db.insert(schema.questions).values({
    id: publicQuestionId,
    title: 'Extend Monday board to add estimations column with shorthand normalization',
    description: 'Extend an existing Monday.com-style board by adding an estimations column that accepts and normalizes shorthand time notation.',
    role: 'frontend',
    difficulty: 'medium',
    status: 'published',
    repositoryUrl: 'https://github.com/ronka/cruxai-monday-question.git',
    startingBranch: 'main',
    targetBranch: 'solution',
    timeLimitValue: 60,
    timeLimitUnit: 'minutes',
    hardStop: false,
    allowedModels: [],
    ownerId: null,
    isPublic: true,
  }).onConflictDoNothing();

  // --- Job Roles ---
  const roles = [
    { legacyId: 'role-001', title: 'Frontend Engineer', description: 'We are looking for a skilled frontend engineer to join our team and help build beautiful, performant user interfaces.', status: 'open' as const },
    { legacyId: 'role-002', title: 'Backend Engineer', description: 'Join our backend team to design and implement scalable APIs and services.', status: 'open' as const },
    { legacyId: 'role-003', title: 'Frontend Engineer', description: 'Frontend position focusing on React and TypeScript development.', status: 'paused' as const },
    { legacyId: 'role-004', title: 'Full Stack Developer', description: 'Looking for a versatile developer comfortable with both frontend and backend technologies.', status: 'draft' as const },
    { legacyId: 'role-005', title: 'DevOps Engineer', description: 'DevOps engineer to manage our cloud infrastructure and CI/CD pipelines.', status: 'closed' as const },
  ];

  for (const role of roles) {
    await db.insert(schema.jobRoles).values({
      id: toUuid(role.legacyId),
      title: role.title,
      description: role.description,
      ownerId: seedOwnerId,
      status: role.status,
    }).onConflictDoNothing();
  }

  // --- Role-Question Assignments ---
  for (const legacyRoleId of ['role-001', 'role-002', 'role-003']) {
    await db.insert(schema.roleQuestionAssignments).values({
      roleId: toUuid(legacyRoleId),
      questionId,
      position: 0,
    }).onConflictDoNothing();
  }

  // --- Candidates (deduped by email — person only) ---
  const candidatesData = [
    { legacyId: 'cand-001', name: 'Alex Johnson', email: 'alex.j@email.com' },
    { legacyId: 'cand-002', name: 'Maria Garcia', email: 'maria.g@email.com' },
    { legacyId: 'cand-003', name: 'David Park', email: 'david.p@email.com' },
    { legacyId: 'cand-004', name: 'Emma Wilson', email: 'emma.w@email.com' },
    { legacyId: 'cand-005', name: 'Lisa Chang', email: 'lisa.c@email.com' },
    { legacyId: 'cand-006', name: 'Chris Lee', email: 'chris.l@email.com' },
    { legacyId: 'cand-007', name: 'Sophie Brown', email: 'sophie.b@email.com' },
    { legacyId: 'cand-008', name: 'James Miller', email: 'james.m@email.com' },
  ];

  for (const c of candidatesData) {
    await db.insert(schema.candidates).values({
      id: toUuid(c.legacyId),
      name: c.name,
      email: c.email,
      ownerId: seedOwnerId,
    }).onConflictDoNothing();
  }

  // --- Invites (candidate + role + question + inviteCode) ---
  const invitesData = [
    { legacyId: 'invite-001', candidateId: 'cand-001', roleId: 'role-001', inviteCode: 'alex001abc12', createdAt: '2024-12-16T10:00:00Z' },
    { legacyId: 'invite-002', candidateId: 'cand-002', roleId: 'role-001', inviteCode: 'maria002def3', createdAt: '2024-12-17T09:00:00Z' },
    { legacyId: 'invite-003', candidateId: 'cand-003', roleId: 'role-001', inviteCode: 'david003ghi4', createdAt: '2024-12-18T14:00:00Z' },
    { legacyId: 'invite-004', candidateId: 'cand-004', roleId: 'role-001', inviteCode: 'emma004jkl56', createdAt: '2024-12-15T08:00:00Z' },
    { legacyId: 'invite-005', candidateId: 'cand-005', roleId: 'role-001', inviteCode: 'lisa005mno78', createdAt: '2024-12-20T11:00:00Z' },
    { legacyId: 'invite-006', candidateId: 'cand-006', roleId: 'role-002', inviteCode: 'chris006pqr9', createdAt: '2024-12-12T09:00:00Z' },
    { legacyId: 'invite-007', candidateId: 'cand-007', roleId: 'role-002', inviteCode: 'sophie07stu0', createdAt: '2024-12-19T10:00:00Z' },
    { legacyId: 'invite-008', candidateId: 'cand-008', roleId: 'role-002', inviteCode: 'james008vwx1', createdAt: '2024-12-21T14:00:00Z' },
  ];

  for (const invite of invitesData) {
    await db.insert(schema.invites).values({
      id: toUuid(invite.legacyId),
      candidateId: toUuid(invite.candidateId),
      roleId: toUuid(invite.roleId),
      questionId,
      inviteCode: invite.inviteCode,
      createdAt: new Date(invite.createdAt),
    }).onConflictDoNothing();
  }

  // --- Submissions (linked to invites) ---
  const submissionsData: Array<{
    legacyId: string;
    inviteId: string;
    status: 'reviewed' | 'submitted' | 'in_progress';
    startedAt: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    analysisResult: AnalysisResult | null;
  }> = [
    { legacyId: 'sub-001', inviteId: 'invite-001', status: 'reviewed', startedAt: '2024-12-16T14:00:00Z', submittedAt: '2024-12-20T14:30:00Z', reviewedAt: '2024-12-21T09:00:00Z', analysisResult: { messageInsights: [{ messageIndex: 0, intent: 'requirement', quality: 'strong', flags: ['exemplar'], reasoning: 'Clearly articulated the feature requirements upfront.' }, { messageIndex: 2, intent: 'implementation', quality: 'adequate', flags: [], reasoning: 'Asked a reasonable implementation question.' }, { messageIndex: 4, intent: 'debugging', quality: 'weak', flags: ['teaching-moment'], reasoning: 'Did not provide enough context about the error.' }] } },
    { legacyId: 'sub-002', inviteId: 'invite-002', status: 'submitted', startedAt: '2024-12-18T11:00:00Z', submittedAt: '2024-12-21T09:15:00Z', reviewedAt: null, analysisResult: null },
    { legacyId: 'sub-003', inviteId: 'invite-003', status: 'in_progress', startedAt: '2024-12-19T10:00:00Z', submittedAt: null, reviewedAt: null, analysisResult: null },
    { legacyId: 'sub-004', inviteId: 'invite-004', status: 'reviewed', startedAt: '2024-12-15T10:00:00Z', submittedAt: '2024-12-19T16:45:00Z', reviewedAt: '2024-12-20T11:00:00Z', analysisResult: { messageInsights: [{ messageIndex: 0, intent: 'clarification', quality: 'strong', flags: ['exemplar'], reasoning: 'Proactively clarified ambiguous requirements before diving in.' }, { messageIndex: 1, intent: 'implementation', quality: 'strong', flags: [], reasoning: 'Proposed a clean implementation approach.' }, { messageIndex: 3, intent: 'review', quality: 'strong', flags: ['exemplar'], reasoning: 'Self-reviewed the solution and asked targeted follow-up questions.' }] } },
    { legacyId: 'sub-005', inviteId: 'invite-006', status: 'reviewed', startedAt: '2024-12-12T14:00:00Z', submittedAt: '2024-12-18T11:20:00Z', reviewedAt: '2024-12-19T10:00:00Z', analysisResult: { messageInsights: [{ messageIndex: 0, intent: 'requirement', quality: 'adequate', flags: [], reasoning: 'Reasonable understanding of the task requirements.' }, { messageIndex: 2, intent: 'debugging', quality: 'weak', flags: ['red-flag'], reasoning: 'Jumped to conclusions without systematically investigating the issue.' }] } },
    { legacyId: 'sub-006', inviteId: 'invite-007', status: 'submitted', startedAt: '2024-12-20T09:00:00Z', submittedAt: '2024-12-22T08:00:00Z', reviewedAt: null, analysisResult: null },
  ];

  for (const s of submissionsData) {
    await db.insert(schema.submissions).values({
      id: toUuid(s.legacyId),
      inviteId: toUuid(s.inviteId),
      status: s.status,
      startedAt: s.startedAt ? new Date(s.startedAt) : null,
      submittedAt: s.submittedAt ? new Date(s.submittedAt) : null,
      reviewedAt: s.reviewedAt ? new Date(s.reviewedAt) : null,
      analysisResult: s.analysisResult,
    }).onConflictDoNothing();
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
