import type { Page } from '@playwright/test';
import type { InviteResolutionResponse } from '../../src/types/question-resolved';
import type { Question } from '../../src/types/question-shared';
import type { Candidate, Invite } from '../../src/types/recruiter';

export const INVITE_CODE = 'testinvite12';
export const QUESTION_ID = 'q-001';

export const mockCandidate: Candidate = {
  id: 'cand-test',
  name: 'Test Candidate',
  email: 'test@example.com',
  createdAt: '2024-12-01T00:00:00Z',
};

export const mockInvite: Invite = {
  id: 'invite-test',
  candidateId: 'cand-test',
  roleId: 'role-001',
  questionId: QUESTION_ID,
  inviteCode: INVITE_CODE,
  createdAt: '2024-12-01T00:00:00Z',
};

export const mockQuestion: Question = {
  id: QUESTION_ID,
  title: 'Frontend Coding Challenge',
  description: 'Build a small React component.',
  role: 'frontend',
  difficulty: 'medium',
  repository: {
    url: 'https://github.com/example/repo',
    startingBranch: 'main',
    targetBranch: 'solution',
  },
  status: 'published',
  aiPermissions: { allowedModels: [] },
  timeConstraints: { limit: 90, unit: 'minutes', hardStop: false },
  ownerId: null,
  isPublic: false,
  createdAt: '2024-12-01T00:00:00Z',
  updatedAt: '2024-12-01T00:00:00Z',
};

export const mockInviteResolutionResponse: InviteResolutionResponse = {
  questionId: QUESTION_ID,
  source: 'recruiter_invite',
  question: mockQuestion,
  invite: {
    invite: mockInvite,
    candidate: mockCandidate,
    roleName: 'Frontend Engineer',
    timeConstraints: { limit: 90, unit: 'minutes', hardStop: false },
  },
};

let chatCounter = 0;

export async function setupInviteFlowRoutes(page: Page) {
  chatCounter = 0;

  // GET /api/invite/:code
  await page.route(`**/api/invite/${INVITE_CODE}`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockInviteResolutionResponse),
    });
  });

  // GET /api/questions/:id (glob to handle optional query params)
  await page.route('**/api/questions/q-001**', (route) => {
    const response = {
      source: 'recruiter_invite',
      question: mockQuestion,
      invite: mockInviteResolutionResponse.invite,
    };
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  // POST /api/create-sandbox
  await page.route('**/api/create-sandbox', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sandboxId: 'sandbox-mock-1', url: 'about:blank', files: {} }),
    });
  });

  // GET /api/invites/:code/session — no in-progress session
  await page.route(`**/api/invites/${INVITE_CODE}/session`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'none' }),
    });
  });

  // GET /api/submissions — return empty array (no pre-existing submissions for test invite)
  await page.route('**/api/submissions**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  // POST /api/chat — AI SDK Data Stream v2
  await page.route('**/api/chat', (route) => {
    chatCounter++;
    const messageId = `msg-mock-${chatCounter}`;
    const body = [
      `f:{"messageId":"${messageId}"}`,
      `0:"Mock AI response."`,
      `d:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":10}}`,
    ].join('\n') + '\n';

    route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1',
      },
      body,
    });
  });
}
