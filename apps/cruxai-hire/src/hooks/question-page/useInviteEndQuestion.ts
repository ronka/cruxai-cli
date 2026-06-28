import * as Sentry from "@sentry/nextjs";
import { useTRPCClient } from '@/lib/trpc/trpc';
import { useQuestionSessionStore } from '@/stores/questionSessionStore';
import type { InviteContext } from '@/types/question-resolved';
import type { TimelineSnapshotSerialized } from '@/types/timeline';

interface SessionData {
  snapshots: TimelineSnapshotSerialized[];
  timeSpent: string;
  timeExceeded: boolean;
  messageCount: number;
}

export function useInviteEndQuestion(
  inviteCode: string | null,
  inviteContext: InviteContext | null,
  questionId: string
) {
  const trpc = useTRPCClient();
  const setSubmissionId = useQuestionSessionStore((state) => state.setSubmissionId);

  return async function markCompleted(sessionData?: SessionData) {
    if (!inviteCode || !inviteContext) return;

    const inviteId = inviteContext.invite.id;
    const submissions = await trpc.submissions.list.query({ inviteId }).catch(() => []);
    const submission = submissions[0] ?? null;

    if (submission) {
      setSubmissionId(submission.id);
      if (sessionData) {
        // TODO: remove snapshots from schema, validation, and DB column once confirmed safe
        await trpc.submissions.submitSessionBackground.mutate({
          id: submission.id,
          data: {
            snapshots: [],
            timeSpent: sessionData.timeSpent,
            timeExceeded: sessionData.timeExceeded,
            messageCount: sessionData.messageCount,
          },
        }).catch((err) => Sentry.captureException(err));
      } else {
        await trpc.submissions.updateStatus.mutate({
          id: submission.id,
          status: 'submitted',
        }).catch((err) => Sentry.captureException(err));
      }
    }
  };
}
