import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, recruiterProcedure } from '../init';
import { engine } from '@/lib/rule-engine.server';
import { scoreFindings } from '@/rule-engine/scoring';
import { getSubmissionById } from '@/server/services/submissions';
import { submissionToSession } from '@/server/services/rule-engine-adapter';

export const rulesRouter = router({
  analyzeSubmission: recruiterProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ input }) => {
      const submission = await getSubmissionById(input.submissionId);
      if (!submission) throw new TRPCError({ code: 'NOT_FOUND', message: 'Submission not found' });
      const session = submissionToSession(submission);
      const findings = engine.analyze(session);
      const registeredGroups = Array.from(new Set(engine.getRules().map(r => r.group)));
      const score = scoreFindings(findings, { registeredGroups });
      return { findings, score };
    }),
});
