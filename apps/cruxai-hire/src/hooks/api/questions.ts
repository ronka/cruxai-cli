'use client';

import { useTRPC } from '@/lib/trpc/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useQuestionsQuery(filters?: { status?: string; role?: string; ownedOnly?: boolean }) {
  const trpc = useTRPC();
  return useQuery(trpc.questions.list.queryOptions(filters));
}

export function useQuestionQuery(id: string) {
  const trpc = useTRPC();
  return useQuery(trpc.questions.byId.queryOptions({ id }, { enabled: !!id }));
}

export function useCreateQuestionMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.questions.create.mutationOptions({
    onSuccess: () => qc.invalidateQueries(trpc.questions.list.queryFilter()),
  }));
}

export function useUpdateQuestionMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.questions.update.mutationOptions({
    onSuccess: (_, { id }) => {
      qc.invalidateQueries(trpc.questions.list.queryFilter());
      qc.invalidateQueries(trpc.questions.byId.queryFilter({ id }));
    },
  }));
}

export function useDeleteQuestionMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.questions.delete.mutationOptions({
    onSuccess: () => qc.invalidateQueries(trpc.questions.list.queryFilter()),
  }));
}

export function useDuplicateQuestionMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.questions.duplicate.mutationOptions({
    onSuccess: () => qc.invalidateQueries(trpc.questions.list.queryFilter()),
  }));
}
