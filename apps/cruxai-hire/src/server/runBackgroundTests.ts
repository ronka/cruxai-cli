import * as Sentry from "@sentry/nextjs";
import { Sandbox } from "@vercel/sandbox";
import { getSubmissionById, saveTestSummary } from "@/server/services/submissions";
import type { JestReport } from "@/types/test-results";

const SANDBOX_ROOT = '/vercel/sandbox';

export async function runBackgroundTests(submissionId: string): Promise<void> {
  const submission = await getSubmissionById(submissionId).catch(() => null);
  if (!submission || !submission.sandboxId) return;

  let sandbox: Sandbox;
  try {
    sandbox = await Sandbox.get({ sandboxId: submission.sandboxId });
  } catch (error) {
    console.error("[runBackgroundTests] Could not get sandbox:", error);
    return;
  }

  if (sandbox.status === 'stopped' || sandbox.status === 'stopping' || sandbox.status === 'failed') {
    return;
  }

  try {
    const result = await sandbox.runCommand({ cmd: 'npx', args: ['jest', '--json'], cwd: SANDBOX_ROOT });
    const stdout = await result.stdout();
    const jsonStart = stdout.indexOf('{');
    if (jsonStart === -1) throw new Error('No JSON in jest output');
    const report: JestReport = JSON.parse(stdout.slice(jsonStart));
    await saveTestSummary(submissionId, { passed: report.numPassedTests, total: report.numTotalTests });
  } catch (error) {
    Sentry.captureException(error);
    console.error("[runBackgroundTests] Failed:", error);
  }
}
