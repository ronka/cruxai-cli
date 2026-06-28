import { z } from 'zod';

export const createCandidateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  notes: z.string().optional(),
});

export const updateCandidateSchema = createCandidateSchema.partial();

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
