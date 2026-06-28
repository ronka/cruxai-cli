import { test as base, expect } from '@playwright/test';

/* eslint-disable react-hooks/rules-of-hooks */

const MOCK_SESSION = {
  session: { id: 'test-session', userId: 'test-user', expiresAt: new Date(Date.now() + 86400000).toISOString() },
  user: { id: 'test-user', name: 'Test User', email: 'test@example.com', role: 'recruiter', emailVerified: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
};

/**
 * Custom test fixture that blocks any unmocked API route.
 *
 * Playwright uses LIFO route priority (last registered = highest priority).
 * By registering the catch-all abort HERE (before each test's beforeEach),
 * any specific mock registered in beforeEach takes priority automatically.
 * Any API route not explicitly mocked will abort instead of hitting the real server.
 */
export const test = base.extend<{ page: import('@playwright/test').Page }>({
  page: async ({ page }, use) => {
    // Set session cookie so proxy.ts allows access to protected routes
    await page.context().addCookies([{
      name: 'better-auth.session_token',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/',
    }]);

    // Mock better-auth session endpoint
    await page.route('**/api/auth/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SESSION) });
    });

    await page.route('**/api/**', (route) => {
      console.warn(`[TEST] Unmocked API request aborted: ${route.request().method()} ${route.request().url()}`);
      route.abort();
    });
    await use(page);
  },
});

export { expect };
