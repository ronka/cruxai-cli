import { z } from 'zod';

export const createInviteSchema = z.object({
  candidateId: z.string().uuid(),
  roleId: z.string().uuid(),
  questionId: z.string().uuid(),
  inviteCode: z.string().min(1),
  notes: z.string().optional(),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
