'use client';

import { useTRPC } from '@/lib/trpc/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useSubmissionsQuery(filters?: { inviteId?: string }) {
  const trpc = useTRPC();
  return useQuery(trpc.submissions.list.queryOptions(filters));
}

export function useSubmissionQuery(id: string) {
  const trpc = useTRPC();
  return useQuery(trpc.submissions.byId.queryOptions({ id }, { enabled: !!id }));
}

export function useCreateSubmissionMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.submissions.create.mutationOptions({
    onSuccess: () => qc.invalidateQueries(trpc.submissions.list.queryFilter()),
  }));
}

export function useUpdateSubmissionMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.submissions.update.mutationOptions({
    onSuccess: (_, { id }) => {
      qc.invalidateQueries(trpc.submissions.list.queryFilter());
      qc.invalidateQueries(trpc.submissions.byId.queryFilter({ id }));
    },
  }));
}

export function useUpdateSubmissionStatusMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.submissions.updateStatus.mutationOptions({
    onSuccess: (_, { id }) => {
      qc.invalidateQueries(trpc.submissions.list.queryFilter());
      qc.invalidateQueries(trpc.submissions.byId.queryFilter({ id }));
    },
  }));
}

export function useSubmitSessionMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.submissions.submitSession.mutationOptions({
    onSuccess: (_, { id }) => {
      qc.invalidateQueries(trpc.submissions.list.queryFilter());
      qc.invalidateQueries(trpc.submissions.byId.queryFilter({ id }));
    },
  }));
}

export function useSaveAnalysisMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.submissions.saveAnalysis.mutationOptions({
    onSuccess: (_, { id }) => {
      qc.invalidateQueries(trpc.submissions.list.queryFilter());
      qc.invalidateQueries(trpc.submissions.byId.queryFilter({ id }));
    },
  }));
}
