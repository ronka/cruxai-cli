import * as Sentry from "@sentry/nextjs";
import { generateText, Output, gateway } from "ai";
import { getSubmissionById, updateSubmissionStatus, saveAnalysis, incrementTokenUsage } from "@/server/services/submissions";
import { getQuestionById } from "@/server/services/questions";
import { getAnalysisPrompt } from "@/server/prompts";
import { analysisResponseSchema } from "@/server/analysisSchema";
import { getDefaultModel } from "@/lib/models";
import { simplifyMessages, snapshotsToSystemMessages } from "@/lib/analysisUtils";
import type { TimelineSnapshot } from "@/types/timeline";

export async function runBackgroundAnalysis(submissionId: string): Promise<void> {
  console.log("[runBackgroundAnalysis] Started for submission:", submissionId);
  const submission = await getSubmissionById(submissionId).catch(() => null);
  if (!submission) {
    console.error("[runBackgroundAnalysis] Submission not found:", submissionId);
    return;
  }

  const questionId = submission.questionId;
  if (!questionId) {
    console.error("[runBackgroundAnalysis] No questionId on submission:", submissionId);
    return;
  }

  const question = await getQuestionById(questionId).catch(() => null);
  if (!question) {
    console.error("[runBackgroundAnalysis] Question not found:", questionId);
    return;
  }

  // Mark as analyzing before starting
  await updateSubmissionStatus(submissionId, "analyzing").catch(() => null);

  try {
    const messages = submission.chatMessages ?? [];
    // Timestamps are stored as strings in JSONB — convert back to Date before processing
    const snapshots: TimelineSnapshot[] = (submission.snapshots ?? []).map((s) => ({
      ...s,
      timestamp: new Date(s.timestamp),
    }));

    const prompt = getAnalysisPrompt({
      questionTitle: question.title,
      questionDifficulty: question.difficulty,
      questionRole: question.role,
      messages: simplifyMessages(messages),
      systemMessages: snapshotsToSystemMessages(snapshots, messages),
      timeSpent: submission.timeSpent ?? "00:00",
    });

    const { output } = await generateText({
      model: gateway(getDefaultModel().id),
      output: Output.object({ schema: analysisResponseSchema }),
      prompt,
    });

    if (!output) return;

    // Backfill any missing message insights
    const userIndices = simplifyMessages(messages)
      .map((m, idx) => ({ role: m.role, idx }))
      .filter(({ role }) => role === "user")
      .map(({ idx }) => idx);
    const insightsByIndex = new Map(output.messageInsights.map((i) => [i.messageIndex, i]));
    for (const idx of userIndices) {
      if (!insightsByIndex.has(idx)) {
        output.messageInsights.push({ messageIndex: idx, intent: "follow-up", quality: "adequate", flags: [], reasoning: "No specific classification available." });
      }
    }
    output.messageInsights.sort((a, b) => a.messageIndex - b.messageIndex);

    await saveAnalysis(submissionId, {
      messageInsights: output.messageInsights ?? [],
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error("[runBackgroundAnalysis] Failed:", error);
    await updateSubmissionStatus(submissionId, "analysis_failed").catch(() => null);
  }
}
