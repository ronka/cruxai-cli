import { z } from 'zod';

export const createQuestionSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  role: z.enum(['frontend', 'backend', 'fullstack']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  repositoryUrl: z.string().min(1),
  startingBranch: z.string().default('main'),
  targetBranch: z.string().default('solution'),
  timeLimitValue: z.number().optional(),
  timeLimitUnit: z.enum(['minutes', 'hours']).optional(),
  hardStop: z.boolean().default(false),
  allowedModels: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
});

// isPublic is immutable after creation — strip it from update payloads
export const updateQuestionSchema = createQuestionSchema.omit({ isPublic: true }).partial();

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
