import * as Sentry from "@sentry/nextjs";
import { generateText, Output, gateway } from "ai";
import { getSubmissionById, saveHireRecommendation, incrementTokenUsage } from "@/server/services/submissions";
import { getQuestionById } from "@/server/services/questions";
import { getHireRecommendationPrompt } from "@/server/prompts";
import { hireRecommendationResponseSchema } from "@/server/analysisSchema";
import { getDefaultModel } from "@/lib/models";
import { simplifyMessages, snapshotsToSystemMessages } from "@/lib/analysisUtils";
import type { TimelineSnapshot } from "@/types/timeline";

export async function runBackgroundHireRecommendation(submissionId: string): Promise<void> {
  console.log("[runBackgroundHireRecommendation] Started for submission:", submissionId);
  const submission = await getSubmissionById(submissionId).catch(() => null);
  if (!submission) {
    console.error("[runBackgroundHireRecommendation] Submission not found:", submissionId);
    return;
  }

  const questionId = submission.questionId;
  if (!questionId) {
    console.error("[runBackgroundHireRecommendation] No questionId on submission:", submissionId);
    return;
  }

  const question = await getQuestionById(questionId).catch(() => null);
  if (!question) {
    console.error("[runBackgroundHireRecommendation] Question not found:", questionId);
    return;
  }

  try {
    const messages = submission.chatMessages ?? [];
    const snapshots: TimelineSnapshot[] = (submission.snapshots ?? []).map((s) => ({
      ...s,
      timestamp: new Date(s.timestamp),
    }));

    const prompt = getHireRecommendationPrompt({
      questionTitle: question.title,
      questionDifficulty: question.difficulty,
      questionRole: question.role,
      messages: simplifyMessages(messages),
      systemMessages: snapshotsToSystemMessages(snapshots, messages),
      timeSpent: submission.timeSpent ?? "00:00",
    });

    const { output, usage } = await generateText({
      model: gateway(getDefaultModel().id),
      output: Output.object({ schema: hireRecommendationResponseSchema }),
      prompt,
    });

    if (!output) return;

    await saveHireRecommendation(submissionId, {
      recommendation: output.recommendation,
      reasoning: output.reasoning,
    });
    await incrementTokenUsage(submissionId, usage.inputTokens ?? 0, usage.outputTokens ?? 0);
  } catch (error) {
    Sentry.captureException(error);
    console.error("[runBackgroundHireRecommendation] Failed:", error);
  }
}
