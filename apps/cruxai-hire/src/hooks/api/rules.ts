'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc/trpc';

export function useSubmissionFindingsQuery(submissionId: string | undefined) {
  const trpc = useTRPC();
  return useQuery(trpc.rules.analyzeSubmission.queryOptions(
    { submissionId: submissionId! },
    { enabled: !!submissionId },
  ));
}
