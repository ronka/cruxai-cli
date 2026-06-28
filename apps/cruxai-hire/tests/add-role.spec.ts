import { test, expect } from './fixtures';
import type { JobRole } from '../src/types/recruiter';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const createdRoles: JobRole[] = [];

  // Stateful mock: POST captures the role; GET returns the accumulated list
  await page.route('**/api/roles', (route) => {
    if (route.request().method() === 'POST') {
      const data = route.request().postDataJSON() as Partial<JobRole>;
      const role: JobRole = {
        id: 'role-test-1',
        title: data.title ?? '',
        description: data.description ?? '',
        recruiterName: data.recruiterName ?? '',
        status: 'draft',
        questionIds: data.questionIds ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createdRoles.push(role);
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(role) });
    } else {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createdRoles) });
    }
  });

  // Empty arrays for all other API routes the recruiters page queries
  for (const pattern of ['**/api/candidates**', '**/api/invites**', '**/api/submissions**', '**/api/questions**']) {
    await page.route(pattern, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
  }
});

test('adds a new role and sees it in the job roles page', async ({ page }) => {
  // 1. Navigate to /recruiters
  await page.goto('/recruiters');

  // 2. Wait for hydration (heading confirms page is ready)
  await expect(page.getByRole('heading', { name: 'Job Roles' })).toBeVisible();

  // 3. Click "New Role" button
  await page.getByRole('link', { name: 'New Role' }).click();
  await page.waitForURL('**/recruiters/roles/new');

  // 4. Fill in required form fields
  await page.getByLabel('Role Title *').fill('Test Playwright Role');

  // 5. Submit the form
  await page.getByRole('button', { name: 'Save Role' }).click();

  // 6. Assert redirect back to /recruiters
  await page.waitForURL('**/recruiters');

  // 7. Verify the new role appears in the Roles table (Roles tab is default)
  await expect(page.getByRole('cell', { name: 'Test Playwright Role' })).toBeVisible();
});
