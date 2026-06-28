'use client';

import { useTRPC } from '@/lib/trpc/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useCandidatesQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.candidates.list.queryOptions());
}

export function useCandidateQuery(id: string) {
  const trpc = useTRPC();
  return useQuery(trpc.candidates.byId.queryOptions({ id }, { enabled: !!id }));
}

export function useCreateCandidateMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.candidates.create.mutationOptions({
    onSuccess: () => qc.invalidateQueries(trpc.candidates.list.queryFilter()),
  }));
}

export function useUpdateCandidateMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.candidates.update.mutationOptions({
    onSuccess: (_, { id }) => {
      qc.invalidateQueries(trpc.candidates.list.queryFilter());
      qc.invalidateQueries(trpc.candidates.byId.queryFilter({ id }));
    },
  }));
}

export function useDeleteCandidateMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.candidates.delete.mutationOptions({
    onSuccess: () => qc.invalidateQueries(trpc.candidates.list.queryFilter()),
  }));
}
