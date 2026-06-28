'use client';

import { useTRPC } from '@/lib/trpc/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useInvitesQuery(filters?: { candidateId?: string; roleId?: string; questionId?: string }) {
  const trpc = useTRPC();
  return useQuery(trpc.invites.list.queryOptions(filters));
}

export function useInviteQuery(id: string) {
  const trpc = useTRPC();
  return useQuery(trpc.invites.byId.queryOptions({ id }, { enabled: !!id }));
}

export function useCreateInviteMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.invites.create.mutationOptions({
    onSuccess: () => qc.invalidateQueries(trpc.invites.list.queryFilter()),
  }));
}

export function useDeleteInviteMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation(trpc.invites.delete.mutationOptions({
    onSuccess: () => qc.invalidateQueries(trpc.invites.list.queryFilter()),
  }));
}
