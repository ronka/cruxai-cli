export const runtime = "nodejs";

import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { handleChatRequest } from "@/server/chat";
import { resolveQuestion } from "@/server/question-resolver";

export async function POST(request: Request) {
  const { messages, currentFiles, modelId, sandboxId, enableReasoning, questionId, inviteCode, submissionId, elapsedSeconds } = await request.json();

  if (!messages) {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  if (questionId) {
    const resolution = await resolveQuestion(questionId, inviteCode ?? null);
    if (resolution.ok) {
      const { allowedModels } = resolution.data.question.aiPermissions;
      if (allowedModels.length > 0 && !allowedModels.includes(modelId)) {
        return NextResponse.json({ error: "Model not permitted for this question" }, { status: 403 });
      }
    }
  }

  try {
    return await handleChatRequest({
      messages,
      currentFiles: currentFiles || {},
      modelId,
      sandboxId,
      enableReasoning: enableReasoning ?? false,
      submissionId,
      elapsedSeconds: typeof elapsedSeconds === 'number' ? elapsedSeconds : undefined,
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error("[CHAT ROUTE] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
