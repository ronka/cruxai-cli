Ron, yes, Nx is a good fit here. I’d structure it like this:

```txt
repo/
  apps/
    cli/
      src/
        commands/
          login.ts
          upload.ts
          analyze.ts
      bin/
      package.json
      project.json

    dashboard/
      app/
        api/
          cli/
            upload/route.ts
            auth/route.ts
        dashboard/
          page.tsx
      components/
      next.config.ts
      package.json
      project.json

  packages/
    core/
      src/
        analyze-chat-history.ts
        parsers/
        types.ts
      package.json

    db/
      src/
        schema.ts
        client.ts
      package.json

    api-client/
      src/
        index.ts
      package.json

    ui/
      src/
      package.json

    tsconfig/
      base.json
      next.json
      node.json

  nx.json
  pnpm-workspace.yaml
  package.json
  tsconfig.base.json
  eslint.config.mjs
```

The key idea: **don’t let the dashboard import from the CLI**. Put all real business logic in `packages/core`, then both `apps/cli` and `apps/dashboard` import from it.

```txt
CLI ─────────┐
             ├── packages/core
Dashboard ───┘

CLI ──uploads data──> Dashboard API ──writes──> DB
Dashboard ──reads──> DB
```

## Recommended setup

Use **pnpm + Nx**.

```bash
pnpm init
pnpm add -D nx
pnpm nx init
pnpm add -D @nx/next @nx/js
```

Then create or move projects:

```bash
pnpm nx g @nx/next:app dashboard --directory=apps/dashboard
pnpm nx g @nx/js:lib core --directory=packages/core
pnpm nx g @nx/js:lib api-client --directory=packages/api-client
pnpm nx g @nx/js:lib db --directory=packages/db
```

For the oclif app, I’d probably **move your existing CLI into `apps/cli` manually** instead of trying to generate it through Nx. oclif already owns its structure well.

## Root `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## Root `package.json`

```json
{
  "name": "your-product",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "dev": "nx run-many -t dev",
    "dev:dashboard": "nx dev dashboard",
    "dev:cli": "nx run cli:dev",
    "build": "nx run-many -t build",
    "build:dashboard": "nx build dashboard",
    "build:cli": "nx build cli",
    "lint": "nx run-many -t lint",
    "test": "nx run-many -t test"
  },
  "devDependencies": {
    "nx": "latest"
  }
}
```

Vercel detects package managers from the lockfile, and with Corepack it can use the root `packageManager` field. Keep the root `pnpm-lock.yaml` committed. ([Vercel][1])

## CLI `project.json`

Example:

```json
{
  "name": "cli",
  "sourceRoot": "apps/cli/src",
  "projectType": "application",
  "targets": {
    "dev": {
      "command": "tsx apps/cli/bin/dev.js",
      "options": {
        "cwd": "."
      }
    },
    "build": {
      "command": "pnpm --filter @your-scope/cli build"
    },
    "test": {
      "command": "pnpm --filter @your-scope/cli test"
    }
  }
}
```

## CLI `package.json`

Keep oclif mostly normal:

```json
{
  "name": "@your-scope/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "yourcli": "./bin/run.js"
  },
  "scripts": {
    "build": "oclif manifest && tsc -b",
    "dev": "./bin/dev.js",
    "pack": "oclif pack tarballs"
  },
  "dependencies": {
    "@oclif/core": "^4.0.0",
    "@your-scope/core": "workspace:*",
    "@your-scope/api-client": "workspace:*"
  }
}
```

oclif is built for Node.js/TypeScript CLIs and supports generated TS projects with minimal runtime deps, so there’s no reason to rewrite it just because you moved to Nx. ([Oclif][2])

## Dashboard imports shared packages

In `apps/dashboard/package.json`:

```json
{
  "name": "@your-scope/dashboard",
  "dependencies": {
    "@your-scope/core": "workspace:*",
    "@your-scope/db": "workspace:*",
    "@your-scope/ui": "workspace:*"
  }
}
```

If Next complains about TS workspace packages, add this:

```ts
// apps/dashboard/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@your-scope/core",
    "@your-scope/db",
    "@your-scope/ui"
  ]
};

export default nextConfig;
```

Next has `transpilePackages` specifically for bundling workspace packages or packages shipping TS/modern syntax. ([Next.js][3])

## Vercel deployment

For Nx, I’d deploy from the **repo root**, not from `apps/dashboard`.

Vercel settings:

```txt
Root Directory:
<empty>

Framework Preset:
Next.js

Build Command:
pnpm nx build dashboard --configuration=production

Output Directory:
apps/dashboard/.next

Install Command:
pnpm install --frozen-lockfile
```

Nx’s own Vercel guide says to leave Root Directory empty for Nx workspaces, use an Nx build command, and point output to the built app’s `.next` directory. ([Nx][4])

Vercel supports monorepos and lets you configure deployable directories/projects, but with shared packages you need access to files outside the app directory; Vercel’s FAQ notes this is supported through the “Include source files outside of the Root Directory” build setting. ([Vercel][5]) ([Vercel][6])

## Integration flow I’d build

### 1. `yourcli login`

CLI opens:

```txt
https://your-dashboard.com/cli/login?device_code=...
```

User logs in, dashboard creates a token, CLI stores it locally.

Use one of:

```txt
~/.config/yourcli/config.json
```

or better:

```txt
keytar / OS keychain
```

### 2. `yourcli analyze`

CLI scans local files:

```txt
~/.claude/sessions
~/.codex/sessions
```

Then uses:

```ts
import { analyzeSessions } from "@your-scope/core";
```

### 3. `yourcli upload`

CLI calls:

```txt
POST /api/cli/upload
```

With something like:

```json
{
  "machineId": "...",
  "workspace": "...",
  "events": [],
  "summary": {}
}
```

### 4. Dashboard

Next API route validates token, writes to DB, dashboard reads from DB.

For DB, I’d use:

```txt
Supabase Postgres or Neon
Drizzle
Clerk/Auth.js
```

Given your usual stack, **Supabase + Drizzle + Clerk** is totally fine.

## The important architectural call

Do **not** make the CLI upload raw private chat history by default.

Better product shape:

```txt
local CLI parses/anonymizes/summarizes
then uploads metrics + selected evidence
```

Maybe support modes:

```txt
yourcli upload --mode=metrics-only
yourcli upload --mode=redacted
yourcli upload --mode=full
```

For CTO dashboard use cases, this matters a lot commercially. “We don’t exfiltrate raw AI sessions by default” is a sales feature.

## Nx vs Turborepo

Use **Nx** if you want:

```txt
dependency graph
affected builds
code generation
stronger project boundaries
more structured workspace
```

Use **Turborepo** if you want:

```txt
simpler config
less framework opinion
very smooth Vercel path
```

For your case, I’d pick **Nx** because you’ll probably end up with more than just CLI + dashboard:

```txt
apps/cli
apps/dashboard
apps/worker
packages/core
packages/db
packages/parsers
packages/policies
packages/api-client
```

Nx is useful once the product becomes a platform, not just a web app.

## Final structure I’d actually ship

```txt
repo/
  apps/
    cli/
    dashboard/
    worker/              # optional later, for heavy AI analysis

  packages/
    core/                # pure business logic
    parsers/             # claude/codex/cursor parsers
    db/                  # drizzle schema/client
    api-client/          # typed client used by CLI
    auth/                # token/device auth helpers
    ui/                  # shared dashboard UI, optional
    config/              # eslint/tsconfig/prettier

  docs/
    architecture.md
    privacy.md
```

My strong recommendation: start with `apps/cli`, `apps/dashboard`, `packages/core`, `packages/db`, `packages/api-client`. Add `worker` only once Vercel API routes become too slow/heavy.

[1]: https://vercel.com/docs/package-managers?utm_source=chatgpt.com "Package Managers"
[2]: https://oclif.github.io/docs/introduction "Introduction | oclif: The Open CLI Framework"
[3]: https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages?utm_source=chatgpt.com "transpilePackages - next.config.js"
[4]: https://nx.dev/docs/technologies/react/guides/deploy-nextjs-to-vercel "Deploying Next.js Applications to Vercel | Nx"
[5]: https://vercel.com/docs/monorepos "Using Monorepos"
[6]: https://vercel.com/docs/monorepos/monorepo-faq "Monorepos FAQ"

