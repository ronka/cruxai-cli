'use client';

import { useTRPC } from '@/lib/trpc/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useRolesQuery(filters?: { status?: string }) {
  const trpc = useTRPC();
  return useQuery(trpc.roles.list.queryOptions(filters));
}

export function useRoleQuery(id: string) {
  const trpc = useTRPC();
  return useQuery(trpc.roles.byId.queryOptions({ id }, { enabled: !!id }));
}

export function useCreateRoleMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.roles.create.mutationOptions({
    onSuccess: () => qc.invalidateQueries(trpc.roles.list.queryFilter()),
  }));
}

export function useUpdateRoleMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.roles.update.mutationOptions({
    onSuccess: (_, { id }) => {
      qc.invalidateQueries(trpc.roles.list.queryFilter());
      qc.invalidateQueries(trpc.roles.byId.queryFilter({ id }));
    },
  }));
}

export function useDeleteRoleMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.roles.delete.mutationOptions({
    onSuccess: () => qc.invalidateQueries(trpc.roles.list.queryFilter()),
  }));
}

export function useUpdateRoleStatusMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.roles.setStatus.mutationOptions({
    onSuccess: (_, { id }) => {
      qc.invalidateQueries(trpc.roles.list.queryFilter());
      qc.invalidateQueries(trpc.roles.byId.queryFilter({ id }));
    },
  }));
}

export function useSetRoleQuestionsMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.roles.setQuestions.mutationOptions({
    onSuccess: (_, { id }) => {
      qc.invalidateQueries(trpc.roles.list.queryFilter());
      qc.invalidateQueries(trpc.roles.byId.queryFilter({ id }));
    },
  }));
}
