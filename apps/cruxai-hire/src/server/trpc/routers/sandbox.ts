import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import * as Sentry from '@sentry/nextjs';
import { Sandbox } from '@vercel/sandbox';
import ms from 'ms';
import { router, publicProcedure } from '../init';
import { readSandboxFiles, normalizeSandboxPath } from '@/lib/sandbox';
import type { JestReport } from '@/types/test-results';

const DEFAULT_REPOSITORY_URL = 'https://github.com/ronka/cruxai-monday-question.git';
const SANDBOX_ROOT = '/vercel/sandbox';

export const sandboxRouter = router({
  create: publicProcedure
    .input(z.object({ repositoryUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      const repositoryUrl = input.repositoryUrl ?? DEFAULT_REPOSITORY_URL;
      const sandbox = await Sandbox.create({
        source: { url: repositoryUrl, type: 'git' },
        resources: { vcpus: 4 },
        timeout: ms('45m'),
        ports: [3000],
        runtime: 'node24',
      });

      const install = await sandbox.runCommand({
        cmd: 'npm',
        args: ['install', '--loglevel', 'info'],
        stderr: process.stderr,
        stdout: process.stdout,
      });

      if (install.exitCode !== 0) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'npm install failed' });

      await sandbox.runCommand({
        cmd: 'npm',
        args: ['run', 'dev'],
        stderr: process.stderr,
        stdout: process.stdout,
        detached: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const files = await readSandboxFiles(sandbox);
      return { sandboxId: sandbox.sandboxId, url: sandbox.domain(3000), files };
    }),

  readFiles: publicProcedure
    .input(z.object({ sandboxId: z.string() }))
    .mutation(async ({ input }) => {
      const sandbox = await Sandbox.get({ sandboxId: input.sandboxId });
      const files = await readSandboxFiles(sandbox);
      return { files };
    }),

  writeFile: publicProcedure
    .input(z.object({ sandboxId: z.string(), filePath: z.string(), content: z.string() }))
    .mutation(async ({ input }) => {
      const sandbox = await Sandbox.get({ sandboxId: input.sandboxId });
      await sandbox.writeFiles([{
        path: normalizeSandboxPath(input.filePath),
        content: Buffer.from(input.content, 'utf-8'),
      }]);
      return { filePath: input.filePath, content: input.content };
    }),

  writeFiles: publicProcedure
    .input(z.object({
      sandboxId: z.string(),
      files: z.record(z.string()),
      deleteOthers: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const sandbox = await Sandbox.get({ sandboxId: input.sandboxId });

      if (input.deleteOthers) {
        const currentFiles = await readSandboxFiles(sandbox);
        const incomingPaths = new Set(Object.keys(input.files));
        const pathsToDelete = Object.keys(currentFiles).filter((p) => !incomingPaths.has(p));
        for (const path of pathsToDelete) {
          await sandbox.runCommand({ cmd: 'rm', args: ['-f', normalizeSandboxPath(path)], cwd: SANDBOX_ROOT });
        }
      }

      const fileEntries = Object.entries(input.files).map(([path, content]) => ({
        path: normalizeSandboxPath(path),
        content: Buffer.from(content, 'utf-8'),
      }));
      await sandbox.writeFiles(fileEntries);
      return input.files;
    }),

  runTests: publicProcedure
    .input(z.object({ sandboxId: z.string() }))
    .mutation(async ({ input }) => {
      const sandbox = await Sandbox.get({ sandboxId: input.sandboxId });
      const result = await sandbox.runCommand({ cmd: 'npx', args: ['jest', '--json'], cwd: SANDBOX_ROOT });
      const stdout = await result.stdout();
      const stderr = await result.stderr();
      try {
        const jsonStart = stdout.indexOf('{');
        if (jsonStart === -1) throw new Error('No JSON output found');
        const testResults: JestReport = JSON.parse(stdout.slice(jsonStart));
        return { success: true, results: testResults, exitCode: result.exitCode };
      } catch {
        return { success: false, error: 'Failed to parse test results', stdout, stderr, exitCode: result.exitCode };
      }
    }),

  reconnect: publicProcedure
    .input(z.object({ sandboxId: z.string() }))
    .mutation(async ({ input }) => {
      let sandbox: Sandbox;
      try {
        sandbox = await Sandbox.get({ sandboxId: input.sandboxId });
      } catch (error) {
        Sentry.captureException(error);
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Sandbox expired' });
      }

      if (sandbox.status === 'stopped' || sandbox.status === 'stopping' || sandbox.status === 'failed') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Sandbox expired' });
      }

      const files = await readSandboxFiles(sandbox);
      return { sandboxId: sandbox.sandboxId, url: sandbox.domain(3000), files };
    }),
});
