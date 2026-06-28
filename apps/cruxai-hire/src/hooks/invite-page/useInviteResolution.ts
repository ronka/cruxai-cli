import { useTRPC } from '@/lib/trpc/trpc';
import { useQuery } from '@tanstack/react-query';

export function useInviteResolution(code: string) {
  const trpc = useTRPC();
  return useQuery(trpc.invites.byCode.queryOptions(
    { code },
    { staleTime: 5 * 60 * 1000, retry: false }
  ));
}
