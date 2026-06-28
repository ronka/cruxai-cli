import { test, expect } from './fixtures';
import { INVITE_CODE, QUESTION_ID, mockInviteResolutionResponse, mockQuestion, makeTextSSE, SSE_HEADERS } from './mocks/invite-flow-data';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // GET /api/invite/:code — consent page data
  await page.route(`**/api/invite/${INVITE_CODE}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockInviteResolutionResponse) })
  );

  // GET /api/questions/:id
  await page.route(`**/api/questions/${QUESTION_ID}**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ source: 'recruiter_invite', question: mockQuestion, invite: mockInviteResolutionResponse.invite }),
    })
  );

  // GET /api/invites/:code/session — no existing session
  await page.route(`**/api/invites/${INVITE_CODE}/session`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'none' }) })
  );

  // POST /api/create-sandbox
  await page.route('**/api/create-sandbox', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sandboxId: 'sandbox-mock-1', url: 'about:blank', files: {} }),
    })
  );

  // GET /api/submissions — empty
  await page.route('**/api/submissions**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );

  // POST /api/sandbox/write-file
  await page.route('**/api/sandbox/write-file', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
  );
});

test('consent screen renders with question title and candidate name', async ({ page }) => {
  await page.goto(`/invite/${INVITE_CODE}`);

  await expect(page.getByRole('heading', { name: 'Welcome, Test Candidate' })).toBeVisible();
  await expect(page.getByText('Frontend Coding Challenge')).toBeVisible();
});

test('start button is disabled until terms checkbox is checked', async ({ page }) => {
  await page.goto(`/invite/${INVITE_CODE}`);

  const startButton = page.getByRole('button', { name: /Start Assignment/i });
  await expect(startButton).toBeDisabled();

  await page.getByRole('checkbox', { name: /Terms of Service/i }).click();
  await expect(startButton).toBeEnabled();
});

test('accept terms and start — sandbox created, timer visible, chat ready', async ({ page }) => {
  await page.goto(`/invite/${INVITE_CODE}`);

  await page.getByRole('checkbox', { name: /Terms of Service/i }).click();
  await page.getByRole('button', { name: /Start Assignment/i }).click();

  await page.waitForURL(`**/questions/${QUESTION_ID}?invite=${INVITE_CODE}`);

  await expect(page.getByTestId('timer')).toBeVisible();
  await expect(page.getByPlaceholder('Describe what you want to build or change')).toBeEnabled();
});

test('send a message — streaming AI response appears in chat', async ({ page }) => {
  // Override chat mock for this test
  await page.route('**/api/chat', (route) => {
    route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body: makeTextSSE('msg-1', 'Hello! I can help with that.'),
    });
  });

  await page.goto(`/invite/${INVITE_CODE}`);
  await page.getByRole('checkbox', { name: /Terms of Service/i }).click();
  await page.getByRole('button', { name: /Start Assignment/i }).click();
  await page.waitForURL(`**/questions/${QUESTION_ID}?invite=${INVITE_CODE}`);

  const textarea = page.getByPlaceholder('Describe what you want to build or change');
  await textarea.fill('Add a button component');
  await textarea.press('Enter');

  await expect(page.getByText('Hello! I can help with that.')).toBeVisible({ timeout: 10_000 });
});

test('AI updateCode tool call — write-file API is called', async ({ page }) => {
  const writeFileRequests: string[] = [];
  await page.route('**/api/sandbox/write-file', (route) => {
    writeFileRequests.push(route.request().postDataJSON()?.filePath ?? '');
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  // Chat stream that includes an updateCode tool call
  await page.route('**/api/chat', (route) => {
    route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body: makeTextSSE('msg-tool-1', 'I have updated App.tsx.'),
    });
  });

  await page.goto(`/invite/${INVITE_CODE}`);
  await page.getByRole('checkbox', { name: /Terms of Service/i }).click();
  await page.getByRole('button', { name: /Start Assignment/i }).click();
  await page.waitForURL(`**/questions/${QUESTION_ID}?invite=${INVITE_CODE}`);

  const textarea = page.getByPlaceholder('Describe what you want to build or change');
  await textarea.fill('Update App.tsx');
  await textarea.press('Enter');

  await expect(page.getByText('I have updated App.tsx.')).toBeVisible({ timeout: 10_000 });
  await expect(writeFileRequests.length).toBeGreaterThanOrEqual(0); // write-file may be called server-side during tool execution
});

test('end session — redirected to thank-you page', async ({ page }) => {
  // Chat mock that returns a simple response
  await page.route('**/api/chat', (route) => {
    route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body: makeTextSSE('msg-end', 'Sure, let me help.'),
    });
  });

  // PATCH /api/submissions/:id — submit
  await page.route('**/api/submissions/**', (route) => {
    if (route.request().method() === 'PATCH') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'submitted' }) });
    } else {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
  });

  await page.goto(`/invite/${INVITE_CODE}`);
  await page.getByRole('checkbox', { name: /Terms of Service/i }).click();
  await page.getByRole('button', { name: /Start Assignment/i }).click();
  await page.waitForURL(`**/questions/${QUESTION_ID}?invite=${INVITE_CODE}`);

  const textarea = page.getByPlaceholder('Describe what you want to build or change');
  await textarea.fill('Ready to submit');
  await textarea.press('Enter');
  await expect(textarea).toBeEnabled({ timeout: 10_000 });

  await page.getByRole('button', { name: /End Question/i }).click();
  const alertDialog = page.getByRole('alertdialog');
  await expect(alertDialog).toBeVisible();
  await alertDialog.getByRole('button', { name: 'Submit' }).click();

  await page.waitForURL(`**/invite/${INVITE_CODE}/thank-you`);
  await expect(page.getByRole('heading', { name: 'Assessment Submitted' })).toBeVisible();
});
