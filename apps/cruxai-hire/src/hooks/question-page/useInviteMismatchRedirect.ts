import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useInviteMismatchRedirect(
  inviteCode: string | null,
  resolvedQuestionId: string | undefined,
  urlQuestionId: string
) {
  const router = useRouter();

  useEffect(() => {
    if (inviteCode && resolvedQuestionId && resolvedQuestionId !== urlQuestionId) {
      router.replace(`/questions/${resolvedQuestionId}?invite=${inviteCode}`);
    }
  }, [inviteCode, resolvedQuestionId, urlQuestionId, router]);
}
