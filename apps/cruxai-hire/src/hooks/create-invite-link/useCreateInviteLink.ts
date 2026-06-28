import { useCallback, useState } from 'react';
import { useTRPCClient } from '@/lib/trpc/trpc';
import { generateInviteCode, buildInviteUrl } from '@/lib/invite';

interface SubmitArgs {
  candidateId: string;
  roleId: string;
  questionId: string;
}

export function useCreateInviteLink() {
  const trpc = useTRPCClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async ({ candidateId, roleId, questionId }: SubmitArgs) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const inviteCode = generateInviteCode();
      const invite = await trpc.invites.create.mutate({
        candidateId,
        roleId,
        questionId,
        inviteCode,
      });
      await trpc.submissions.createFromInvite.mutate({ inviteId: invite.id, questionId });
      setGeneratedLink(buildInviteUrl(inviteCode));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setIsSubmitting(false);
    }
  }, [trpc]);

  const copy = useCallback(async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedLink]);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setGeneratedLink(null);
    setCopied(false);
    setError(null);
  }, []);

  return { isSubmitting, generatedLink, copied, error, submit, copy, reset };
}
