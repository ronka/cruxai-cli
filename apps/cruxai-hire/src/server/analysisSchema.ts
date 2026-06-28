import { z } from "zod";

export const messageInsightSchema = z.object({
  messageIndex: z.number().int().min(0).describe("Index of the message in the messages array"),
  intent: z.enum(["clarification", "requirement", "implementation", "debugging", "follow-up", "review", "other"]).describe("The primary intent of this user message"),
  quality: z.enum(["strong", "adequate", "weak"]).describe("Quality assessment of this message in context"),
  flags: z.array(z.enum(["exemplar", "red-flag", "teaching-moment"])).describe("Optional flags for notable messages (can be empty)"),
  reasoning: z.string().describe("Explanation for the intent, quality, and any flags assigned"),
});

export const analysisResponseSchema = z.object({
  messageInsights: z.array(messageInsightSchema).describe("Classification for every user message in the conversation"),
});

export type MessageInsight = z.infer<typeof messageInsightSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
export type AnalysisApiResponse = AnalysisResponse & {
  usage?: { tokensIn: number; tokensOut: number };
};

export const systemMessageSchema = z.object({
  type: z.enum(['checkpoint-created', 'checkpoint-reverted']),
  timestamp: z.string(),
  label: z.string(),
  afterMessageIndex: z.number(),
  isManualEdit: z.boolean().optional(),
});

export type SystemMessageForAPI = z.infer<typeof systemMessageSchema>;

export const analysisInputSchema = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.string() })),
  systemMessages: z.array(systemMessageSchema).default([]),
  questionId: z.string(),
  submissionId: z.string().optional(),
  timeSpent: z.string(),
  modelId: z.string().optional(),
});

export type AnalysisInput = z.infer<typeof analysisInputSchema>;

export const hireRecommendationResponseSchema = z.object({
  recommendation: z.enum(['strong', 'medium', 'no_hire']).describe("Overall hire recommendation based on the entire interview"),
  reasoning: z.string().describe("One sentence explaining the hire recommendation"),
});

export type HireRecommendationResponse = z.infer<typeof hireRecommendationResponseSchema>;
export type HireRecommendationApiResponse = HireRecommendationResponse & {
  usage?: { tokensIn: number; tokensOut: number };
};
