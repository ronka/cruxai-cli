import { test, expect } from './fixtures';
import { INVITE_CODE, QUESTION_ID, mockInviteResolutionResponse, mockQuestion, makeTextSSE, SSE_HEADERS } from './mocks/invite-flow-data';
import type { InviteSessionResponse } from '../src/lib/api/invites';

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Registers the shared routes used by the question page. */
async function setupQuestionPageRoutes(page: import('@playwright/test').Page) {
  await page.route(`**/api/questions/${QUESTION_ID}**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ source: 'recruiter_invite', question: mockQuestion, invite: mockInviteResolutionResponse.invite }),
    })
  );

  await page.route('**/api/submissions**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );

  await page.route('**/api/sandbox/reconnect', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sandboxId: 'sandbox-mock-reconnect', url: 'about:blank', files: {} }),
    })
  );

  await page.route('**/api/sandbox/write-file', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
  );
}

// ─── Session restore ──────────────────────────────────────────────────────

test('returning to a session restores prior chat messages', async ({ page }) => {
  const priorMessages = [
    { id: 'msg-prior-1', role: 'user' as const, parts: [{ type: 'text' as const, text: 'Can you help me?' }] },
    { id: 'msg-prior-2', role: 'assistant' as const, parts: [{ type: 'text' as const, text: 'Sure, what do you need?' }] },
  ];

  const inProgressSession: InviteSessionResponse = {
    status: 'in_progress',
    submissionId: 'sub-restore-1',
    chatMessages: priorMessages,
    sandboxId: 'sandbox-mock-reconnect',
    startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // started 5 min ago
    snapshots: [],
  };

  await page.route(`**/api/invites/${INVITE_CODE}/session`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(inProgressSession) })
  );
  await page.route(`**/api/invite/${INVITE_CODE}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockInviteResolutionResponse) })
  );
  await setupQuestionPageRoutes(page);

  await page.goto(`/questions/${QUESTION_ID}?invite=${INVITE_CODE}`);

  await expect(page.getByText('Can you help me?')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Sure, what do you need?')).toBeVisible();
});

test('timer resumes at the correct elapsed offset, not from zero', async ({ page }) => {
  const elapsedSeconds = 5 * 60; // 5 minutes elapsed
  const startedAt = new Date(Date.now() - elapsedSeconds * 1000).toISOString();

  const inProgressSession: InviteSessionResponse = {
    status: 'in_progress',
    submissionId: 'sub-timer-1',
    chatMessages: [],
    sandboxId: 'sandbox-mock-reconnect',
    startedAt,
    snapshots: [],
  };

  await page.route(`**/api/invites/${INVITE_CODE}/session`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(inProgressSession) })
  );
  await page.route(`**/api/invite/${INVITE_CODE}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockInviteResolutionResponse) })
  );
  await setupQuestionPageRoutes(page);

  await page.goto(`/questions/${QUESTION_ID}?invite=${INVITE_CODE}`);
  await expect(page.getByTestId('timer')).toBeVisible({ timeout: 10_000 });

  // The question has a 90-min limit; after 5 min the timer should show ~85:xx remaining
  // (not 90:00, which would indicate it restarted from zero)
  const timerText = await page.getByTestId('timer').textContent();
  expect(timerText).toBeTruthy();

  // Parse minutes from the timer (format: "MM:SS" or "HH:MM:SS")
  const parts = timerText!.trim().split(':').map(Number);
  const minutesRemaining = parts.length === 3 ? parts[0] * 60 + parts[1] : parts[0];
  // 90 min limit - 5 min elapsed = 85 min remaining (±1 min tolerance for test timing)
  expect(minutesRemaining).toBeGreaterThanOrEqual(83);
  expect(minutesRemaining).toBeLessThanOrEqual(87);
});

test('sandbox reconnects after page return', async ({ page }) => {
  const reconnectRequests: string[] = [];
  await page.route('**/api/sandbox/reconnect', (route) => {
    reconnectRequests.push(route.request().url());
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sandboxId: 'sandbox-mock-reconnect', url: 'about:blank', files: {} }),
    });
  });

  const inProgressSession: InviteSessionResponse = {
    status: 'in_progress',
    submissionId: 'sub-reconnect-1',
    chatMessages: [],
    sandboxId: 'sandbox-mock-reconnect',
    startedAt: new Date(Date.now() - 60 * 1000).toISOString(),
    snapshots: [],
  };

  await page.route(`**/api/invites/${INVITE_CODE}/session`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(inProgressSession) })
  );
  await page.route(`**/api/invite/${INVITE_CODE}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockInviteResolutionResponse) })
  );
  await page.route(`**/api/questions/${QUESTION_ID}**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ source: 'recruiter_invite', question: mockQuestion, invite: mockInviteResolutionResponse.invite }),
    })
  );
  await page.route('**/api/submissions**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
  await page.route('**/api/sandbox/write-file', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
  );

  // Wait for the reconnect request to actually be made (timer becoming visible is not sufficient —
  // it appears while restoreState is still 'idle', before the session fetch completes)
  const reconnectResponse = page.waitForResponse('**/api/sandbox/reconnect', { timeout: 10_000 });
  await page.goto(`/questions/${QUESTION_ID}?invite=${INVITE_CODE}`);
  await reconnectResponse;

  expect(reconnectRequests.length).toBeGreaterThan(0);
});

// ─── Hard stop ────────────────────────────────────────────────────────────

test('hard stop: chat input is disabled when time has expired', async ({ page }) => {
  const hardStopQuestion = {
    ...mockQuestion,
    timeConstraints: { limit: 1, unit: 'minutes' as const, hardStop: true },
  };
  const expiredSession: InviteSessionResponse = {
    status: 'in_progress',
    submissionId: 'sub-hardstop-1',
    chatMessages: [],
    sandboxId: 'sandbox-mock-1',
    startedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // started 2 min ago, limit is 1 min
    snapshots: [],
  };

  await page.route(`**/api/invites/${INVITE_CODE}/session`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(expiredSession) })
  );
  await page.route(`**/api/invite/${INVITE_CODE}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockInviteResolutionResponse) })
  );
  await page.route(`**/api/questions/${QUESTION_ID}**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'recruiter_invite',
        question: hardStopQuestion,
        invite: { ...mockInviteResolutionResponse.invite, timeConstraints: hardStopQuestion.timeConstraints },
      }),
    })
  );
  await page.route('**/api/submissions**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
  await page.route('**/api/sandbox/reconnect', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sandboxId: 'sandbox-mock-1', url: 'about:blank', files: {} }),
    })
  );
  await page.route('**/api/sandbox/write-file', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
  );

  await page.goto(`/questions/${QUESTION_ID}?invite=${INVITE_CODE}`);

  // With hardStop=true and time already expired, the chat textarea should be disabled
  const textarea = page.getByPlaceholder('Describe what you want to build or change');
  await expect(textarea).toBeDisabled({ timeout: 10_000 });
});

// ─── Invalid invite code ──────────────────────────────────────────────────

test('invalid invite code shows an error page', async ({ page }) => {
  const INVALID_CODE = 'does-not-exist';

  await page.route(`**/api/invite/${INVALID_CODE}`, (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Invite not found' }) })
  );

  await page.goto(`/invite/${INVALID_CODE}`);

  // The app should render an error or not-found state
  await expect(
    page.getByRole('heading', { name: /Invalid Invite Link/i })
  ).toBeVisible({ timeout: 10_000 });
});
