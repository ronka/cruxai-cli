import { z } from 'zod';

export const createFromInviteSchema = z.object({
  inviteId: z.string().uuid(),
  questionId: z.string().uuid(),
});

export const createSubmissionSchema = z.object({
  questionId: z.string().uuid(),
});

export const updateSubmissionSchema = z.object({
  status: z.enum(['in_progress', 'submitted', 'analyzing', 'analysis_failed', 'reviewed']).optional(),
  sandboxId: z.string().nullable().optional(),
  chatMessages: z.array(z.any()).optional(),
  snapshots: z.array(z.any()).optional(),
  analysisResult: z.object({ messageInsights: z.array(z.any()) }).nullable().optional(),
  timeSpent: z.string().nullable().optional(),
  timeExceeded: z.boolean().optional(),
  tokensIn: z.number().optional(),
  tokensOut: z.number().optional(),
  messageCount: z.number().optional(),
  startedAt: z.string().nullable().optional(),
  submittedAt: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
});

export const updateSubmissionStatusSchema = z.object({
  status: z.enum(['in_progress', 'submitted', 'analyzing', 'analysis_failed', 'reviewed']),
});

export const submitSessionSchema = z.object({
  snapshots: z.array(z.any()).default([]),
  timeSpent: z.string().optional(),
  timeExceeded: z.boolean().default(false),
  messageCount: z.number().optional(),
});

export const saveAnalysisSchema = z.object({
  messageInsights: z.array(z.any()).default([]),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type CreateFromInviteInput = z.infer<typeof createFromInviteSchema>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
