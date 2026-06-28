# Repository Guidelines

## Project Structure & Module Organization
- `src/app` holds the Next.js App Router pages, layouts, and route handlers (see `src/app/api`).
- `src/components` contains shared UI components (shadcn/Radix wrappers).
- `src/stores` contains Zustand state management stores.
- `src/lib` is for utilities, helpers, and shared client/server logic.
- `src/hooks` contains reusable React hooks (mostly for React Query mutations).
- `src/server` is for server-only logic.
- `src/data` and `src/types` store static data and shared TypeScript types.
- `public` hosts static assets (images, icons).

## Architecture Overview
- Next.js 15 App Router drives routing and layouts, with route handlers in `src/app/api`.
- Server-only logic lives under `src/server` and should not import client-only modules.
- Treat `src/server/*.ts` files as service modules; keep API handlers thin and delegate to these helpers.
- UI is composed from shadcn/Radix-based components in `src/components`, styled with Tailwind CSS.
- Shared utilities and cross-cutting logic belong in `src/lib` to keep feature folders lean.
- All hooks should be inside abstracted to custom hooks with meaningful name and directory under `src/hooks` directory. e.g. `hooks/code-editor/useEditor`

## State Management

### Zustand Stores
- Client-side application state is managed with Zustand stores in `src/stores/`.
- Each store has a single responsibility with clear boundaries.
- Zustand persist middleware handles localStorage and sessionStorage automatically.
- Use fine-grained selectors to prevent unnecessary re-renders.

### Store Locations
- `settingsStore.ts` - Global AI provider settings and API keys (persisted to localStorage)
- `sandboxStore.ts` - Per-question sandbox files and operations
- `questionSessionStore.ts` - Session tracking for analysis page (persisted to sessionStorage)
- `questionStateStore.ts` - Question page UI state (modal visibility, start status, processed tool calls)
- `timerStore.ts` - Timer functionality for question sessions

### React Query Integration
- Keep React Query for server mutations only (API calls to backend).
- Coordinate mutations with Zustand stores via `onSuccess` callbacks.
- Example: `writeFile` mutation updates `sandboxStore.updateFile()` on success.
- Never duplicate state between React Query cache and Zustand stores.

### Best Practices
- Use shallow selectors for object/array state to minimize re-renders.
- Access only the state you need in each component (selective subscription).
- Reset store state when navigating between questions using store `reset()` methods.
- Avoid storing derived/computed values; use selector functions instead.
- When creating new stores, follow existing patterns for consistency.

### Usage Examples

**Basic selector (single value):**
```typescript
import { useSandboxStore } from '@/stores/sandboxStore';

function FileTree() {
  // Only re-renders when files change
  const files = useSandboxStore((state) => state.files);
}
```

**Multiple values with shallow comparison:**
```typescript
import { useSandboxStore } from '@/stores/sandboxStore';
import { shallow } from 'zustand/shallow';

function CodeView() {
  // Only re-renders when files or sandboxUrl change
  const { files, sandboxUrl } = useSandboxStore(
    (state) => ({ files: state.files, sandboxUrl: state.sandboxUrl }),
    shallow
  );
}
```

**Coordinating with React Query:**
```typescript
import { useMutation } from '@tanstack/react-query';
import { useSandboxStore } from '@/stores/sandboxStore';

function useSandbox() {
  const updateFile = useSandboxStore((state) => state.updateFile);

  const writeFileMutation = useMutation({
    mutationFn: async ({ filePath, content }) => {
      // Call API
      const response = await fetch('/api/sandbox/write-file', { ... });
      return { filePath, content };
    },
    onSuccess: ({ filePath, content }) => {
      // Update Zustand store after successful API call
      updateFile(filePath, content);
    },
  });

  return { writeFile: writeFileMutation.mutateAsync };
}
```

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js dev server.
- `npm run build` builds the production bundle.
- `npm run start` runs the production server after a build.
- `npm run lint` runs Next.js ESLint rules.

## Coding Style & Naming Conventions
- Use TypeScript and React with functional components.
- Indentation: 2 spaces (match existing formatting).
- File naming: `kebab-case` for route folders, `PascalCase` for components (e.g., `src/components/FilterPanel.tsx`).
- Prefer colocating route-specific components under the relevant `src/app/...` folder when they are not reused.
- Use Tailwind CSS utility classes; keep class ordering consistent with existing files.
- Encapsulate every `useEffect` usage in a custom hook located under `src/hooks/[componentName]/`.
- Give each hook a meaningful name and encapsulate any state related to the hook within it.

## Testing Guidelines
- No test framework is configured in `package.json` yet. If you add tests, keep them near the feature they cover (e.g., `src/app/**/__tests__`) and document any new test commands in this file.

## Commit & Pull Request Guidelines
- Commit messages in history use concise, imperative sentences (e.g., "Upgrade Next.js", "Enhance sandbox integration"). Follow that tone.
- PRs should include a clear summary, relevant screenshots for UI changes, and a short test note (e.g., `npm run lint`, manual smoke steps).

## Configuration Tips
- Environment variables should go in local `.env` files; avoid committing secrets.
- If you add new runtime configuration, document it in `README.md` and update this guide.
