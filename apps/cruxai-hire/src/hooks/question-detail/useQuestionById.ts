import { useTRPC } from '@/lib/trpc/trpc';
import { useQuery } from '@tanstack/react-query';

export function useQuestionById(id: string, inviteCode: string | null) {
  const trpc = useTRPC();
  return useQuery(trpc.questions.resolve.queryOptions(
    { id, inviteCode },
    { retry: false, staleTime: 5 * 60_000 }
  ));
}
