import { useRouter } from 'next/navigation';
import { useTRPCClient } from '@/lib/trpc/trpc';
import { useQuestionSessionStore } from '@/stores/questionSessionStore';
import type { InviteContext } from '@/types/question-resolved';

export function useInviteStart() {
  const router = useRouter();
  const trpc = useTRPCClient();
  const setSubmissionId = useQuestionSessionStore((state) => state.setSubmissionId);

  async function triggerInviteStart(inviteContext: InviteContext, questionId: string, code: string) {
    const { invite } = inviteContext;
    const result = await trpc.invites.start.mutate({ inviteId: invite.id }).catch(() => null);
    if (result) setSubmissionId(result.submissionId);
    router.push(`/questions/${questionId}?invite=${code}`);
  }

  return { triggerInviteStart };
}
