import { useTRPC } from '@/lib/trpc/trpc';
import { useMutation } from '@tanstack/react-query';

export type { AnalysisInput, SystemMessageForAPI } from '@/server/analysisSchema';

export function useAnalysisMutation() {
  const trpc = useTRPC();
  return useMutation(trpc.analysis.generate.mutationOptions());
}
