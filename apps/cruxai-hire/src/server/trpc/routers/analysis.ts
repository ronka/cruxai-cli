import { TRPCError } from '@trpc/server';
import { after } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { generateText, Output, gateway } from 'ai';
import { router, publicProcedure } from '../init';
import {
  analysisInputSchema,
  analysisResponseSchema,
  hireRecommendationResponseSchema,
} from '@/server/analysisSchema';
import { getAnalysisPrompt, getHireRecommendationPrompt } from '@/server/prompts';
import { resolveModel } from '@/lib/models';
import { getQuestionById } from '@/server/services/questions';
import { saveAnalysis, saveHireRecommendation, incrementTokenUsage } from '@/server/services/submissions';
import { backfillUserInsights } from '@/server/analysis/backfill';

async function loadQuestionOrThrow(questionId: string) {
  const question = await getQuestionById(questionId).catch(() => null);
  if (!question) throw new TRPCError({ code: 'NOT_FOUND', message: 'Question not found' });
  return question;
}

function persistTokenUsage(submissionId: string, usage: { inputTokens?: number; outputTokens?: number }) {
  return incrementTokenUsage(submissionId, usage.inputTokens ?? 0, usage.outputTokens ?? 0)
    .catch((err) => Sentry.captureException(err));
}

function toUsage(usage: { inputTokens?: number; outputTokens?: number }) {
  return { tokensIn: usage.inputTokens ?? 0, tokensOut: usage.outputTokens ?? 0 };
}

export const analysisRouter = router({
  generate: publicProcedure
    .input(analysisInputSchema)
    .mutation(async ({ input }) => {
      const { messages, systemMessages, questionId, submissionId, timeSpent, modelId } = input;

      const question = await loadQuestionOrThrow(questionId);
      const selectedModel = resolveModel(modelId);

      try {
        const prompt = getAnalysisPrompt({
          questionTitle: question.title,
          questionDifficulty: question.difficulty,
          questionRole: question.role,
          messages,
          systemMessages,
          timeSpent: timeSpent || '00:00',
        });

        const { output, usage } = await generateText({
          model: gateway(selectedModel.id),
          output: Output.object({ schema: analysisResponseSchema }),
          prompt,
        });

        if (!output) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate structured analysis' });

        backfillUserInsights(output.messageInsights, messages);

        if (submissionId) {
          after(async () => {
            await saveAnalysis(submissionId, { messageInsights: output.messageInsights ?? [] }).catch((err) => Sentry.captureException(err));
            await persistTokenUsage(submissionId, usage);
          });
        }

        return { ...output, usage: toUsage(usage) };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        Sentry.captureException(error);
        const message = error instanceof Error ? error.message : 'Failed to generate analysis';
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
      }
    }),

  generateHireRecommendation: publicProcedure
    .input(analysisInputSchema)
    .mutation(async ({ input }) => {
      const { messages, systemMessages, questionId, submissionId, timeSpent, modelId } = input;

      const question = await loadQuestionOrThrow(questionId);
      const selectedModel = resolveModel(modelId);

      try {
        const prompt = getHireRecommendationPrompt({
          questionTitle: question.title,
          questionDifficulty: question.difficulty,
          questionRole: question.role,
          messages,
          systemMessages,
          timeSpent: timeSpent || '00:00',
        });

        const { output, usage } = await generateText({
          model: gateway(selectedModel.id),
          output: Output.object({ schema: hireRecommendationResponseSchema }),
          prompt,
        });

        if (!output) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate hire recommendation' });

        if (submissionId) {
          after(async () => {
            await saveHireRecommendation(submissionId, { recommendation: output.recommendation, reasoning: output.reasoning }).catch((err) => Sentry.captureException(err));
            await persistTokenUsage(submissionId, usage);
          });
        }

        return { ...output, usage: toUsage(usage) };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        Sentry.captureException(error);
        const message = error instanceof Error ? error.message : 'Failed to generate hire recommendation';
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message });
      }
    }),
});
