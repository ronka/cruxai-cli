import { useTRPC } from '@/lib/trpc/trpc';
import { useMutation } from '@tanstack/react-query';
import type { AnalysisInput } from '@/server/analysisSchema';

export type HireRecommendationInput = AnalysisInput;

export function useHireRecommendationMutation() {
  const trpc = useTRPC();
  return useMutation(trpc.analysis.generateHireRecommendation.mutationOptions());
}
