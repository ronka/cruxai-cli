import { z } from 'zod';

export const createRoleSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(''),
  status: z.enum(['draft', 'open', 'paused', 'closed']).default('draft'),
  questionIds: z.array(z.string()).default([]),
});

export const updateRoleSchema = createRoleSchema.partial();

export const updateRoleStatusSchema = z.object({
  status: z.enum(['draft', 'open', 'paused', 'closed']),
});

export const setRoleQuestionsSchema = z.object({
  questionIds: z.array(z.string()),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
