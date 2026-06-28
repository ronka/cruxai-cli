import { test, expect } from './fixtures';
import type { JobRole } from '../src/types/recruiter';
import type { Question } from '../src/types/question-shared';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const createdRoles: JobRole[] = [];
  const createdQuestions: Question[] = [];

  // Single handler for all API routes to avoid ordering/priority issues
  await page.route('**/api/**', (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    // POST /api/roles — create role
    if (path === '/api/roles' && method === 'POST') {
      const data = route.request().postDataJSON() as Partial<JobRole>;
      const role: JobRole = {
        id: 'role-test-1',
        title: data.title ?? '',
        description: data.description ?? '',
        ownerId: 'test-user',
        status: 'draft',
        questionIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createdRoles.push(role);
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(role) });
    // GET /api/roles — list roles
    } else if (path === '/api/roles') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createdRoles) });
    // PUT /api/roles/[id]/questions — attach questions to role
    } else if (/^\/api\/roles\/[^/]+\/questions$/.test(path) && method === 'PUT') {
      const data = route.request().postDataJSON() as { questionIds: string[] };
      const role = createdRoles[0];
      if (role) role.questionIds = data.questionIds;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(role ?? {}) });
    // GET /api/roles/[id] — role detail
    } else if (/^\/api\/roles\/[^/]+$/.test(path)) {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createdRoles[0] ?? null) });
    // POST /api/questions — create question
    } else if (path === '/api/questions' && method === 'POST') {
      const data = route.request().postDataJSON() as {
        title?: string; description?: string; role?: string; difficulty?: string;
        repositoryUrl?: string; startingBranch?: string; targetBranch?: string; allowedModels?: string[];
      };
      const q: Question = {
        id: 'q-test-1',
        title: data.title ?? '',
        description: data.description ?? '',
        role: (data.role as Question['role']) ?? 'frontend',
        difficulty: (data.difficulty as Question['difficulty']) ?? 'medium',
        status: 'draft',
        repository: { url: data.repositoryUrl ?? '', startingBranch: data.startingBranch ?? 'main', targetBranch: data.targetBranch ?? 'solution' },
        aiPermissions: { allowedModels: data.allowedModels ?? [] },
        ownerId: 'test-user',
        isPublic: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      createdQuestions.push(q);
      route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(q) });
    // GET /api/questions — list questions
    } else if (path === '/api/questions') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(createdQuestions) });
    // Everything else — empty array
    } else {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
  });
});

test('creates a role then adds a new question and assigns it to the role', async ({ page }) => {
  // Step 1 — Create role
  await page.goto('/recruiters/roles/new');
  await expect(page.getByRole('heading', { name: 'Create New Role' })).toBeVisible();
  await page.getByLabel('Role Title *').fill('Test Playwright Role');
  await page.getByRole('button', { name: 'Save Role' }).click();
  await page.waitForURL('**/recruiters');

  // Step 2 — Navigate to role detail (client-side nav — preserves localStorage)
  await page.getByRole('cell', { name: 'Test Playwright Role' }).click();
  await expect(page.getByRole('heading', { name: 'Test Playwright Role' })).toBeVisible();

  // Step 3 — Open Questions tab and click New Question
  // (client-side nav to /recruiters/questions/new?roleId=... — preserves localStorage)
  await page.getByRole('tab', { name: /Questions/ }).click();
  await page.getByRole('link', { name: 'New Question' }).click();
  await expect(page.getByRole('heading', { name: 'New Question' })).toBeVisible();

  // Step 4 — Fill in question form
  await page.getByLabel('Question Title').fill('Test Playwright Question');
  await page.getByLabel('Description').fill("Test the candidate's ability to build a React component");
  await page.getByLabel('Repository URL').fill('https://github.com/example/test-repo');

  // Step 5 — Save question (auto-attaches to role and navigates back to role detail)
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForURL('**/recruiters/roles/**');
  await expect(page.getByRole('heading', { name: 'Test Playwright Role' })).toBeVisible();

  // Step 6 — Wait for React Query to settle with updated count, then open Questions tab
  await expect(page.getByRole('tab', { name: /Questions \(1\)/ })).toBeVisible();
  await page.getByRole('tab', { name: /Questions \(1\)/ }).click();
  await expect(page.getByText('Attached Questions (1)')).toBeVisible();
});
