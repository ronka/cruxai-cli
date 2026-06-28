import type { Page } from '@playwright/test';

/** Build an SSE body for a simple text response (AI SDK v6 UIMessageChunk format). */
export function makeTextSSE(messageId: string, text: string): string {
  const textId = `${messageId}-text`;
  const events = [
    { type: 'start', messageId },
    { type: 'text-start', id: textId },
    { type: 'text-delta', id: textId, delta: text },
    { type: 'text-end', id: textId },
    { type: 'finish', finishReason: 'stop' },
  ];
  return events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('');
}

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
} as const;
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

  // POST /api/chat — AI SDK v6 UIMessageChunk SSE format
  await page.route('**/api/chat', (route) => {
    chatCounter++;
    const messageId = `msg-mock-${chatCounter}`;
    route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body: makeTextSSE(messageId, 'Mock AI response.'),
    });
  });
}
