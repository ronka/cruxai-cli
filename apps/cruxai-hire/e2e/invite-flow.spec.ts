import { test, expect } from './fixtures';
import { setupInviteFlowRoutes, INVITE_CODE, QUESTION_ID } from './mocks/invite-flow-data';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await setupInviteFlowRoutes(page);
});

test('completes the full candidate invite flow end-to-end', async ({ page }) => {
  // 1. Navigate to invite landing page
  await page.goto(`/invite/${INVITE_CODE}`);

  // 2. Assert welcome heading visible, checkbox unchecked, button disabled
  await expect(page.getByRole('heading', { name: 'Welcome, Test Candidate' })).toBeVisible();
  const checkbox = page.getByRole('checkbox', { name: /Terms of Service/i });
  await expect(checkbox).not.toBeChecked();
  const startButton = page.getByRole('button', { name: /Start Assignment/i });
  await expect(startButton).toBeDisabled();

  // 3. Accept terms and start assignment
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await expect(startButton).toBeEnabled();
  await startButton.click();

  // 4. Wait for redirect to question page and assert UI elements
  await page.waitForURL(`**/questions/${QUESTION_ID}?invite=${INVITE_CODE}`);
  const textarea = page.getByPlaceholder('Describe what you want to build or change');
  await expect(page.getByTestId('timer')).toBeVisible();

  // 5. Send 3 chat messages, waiting for textarea to re-enable after each
  const messages = ['First message', 'Second message', 'Third message'];
  for (const text of messages) {
    await textarea.fill(text);
    await textarea.press('Enter');
    await expect(textarea).toBeEnabled({ timeout: 10_000 });
  }

  // 6. End question button should be visible and enabled after chat history exists
  const endQuestionButton = page.getByRole('button', { name: /End Question/i });
  await expect(endQuestionButton).toBeVisible();
  await expect(endQuestionButton).toBeEnabled();
  await endQuestionButton.click();

  // 7. Confirm submission in alert dialog
  const alertDialog = page.getByRole('alertdialog');
  await expect(alertDialog).toBeVisible();
  await alertDialog.getByRole('button', { name: 'Submit' }).click();

  // 8. Assert redirect to thank-you page
  await page.waitForURL(`**/invite/${INVITE_CODE}/thank-you`);
  await expect(page.getByRole('heading', { name: 'Assessment Submitted' })).toBeVisible();
});
