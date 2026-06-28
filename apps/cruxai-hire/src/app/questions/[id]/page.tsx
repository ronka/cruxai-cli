'use client';

import * as Sentry from "@sentry/nextjs";
import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useSandbox } from "@/hooks/useSandbox";
import { useSandboxStore } from "@/stores/sandboxStore";
import { useQuestionSessionStore } from "@/stores/questionSessionStore";
import { useTestResultsStore } from "@/stores/testResultsStore";
import { useQuestionStateStore } from "@/stores/questionStateStore";
import { useTimerStore } from "@/stores/timerStore";
import { useCheckpoints } from "@/hooks/question/useCheckpoints";
import { useMessageTokenSync } from "@/hooks/question-detail/useMessageTokenSync";
import { useToolCallFileSync } from "@/hooks/question-detail/useToolCallFileSync";
import { useQuestionById } from "@/hooks/question-detail/useQuestionById";
import { useTimerInitialize } from "@/hooks/question-detail/useTimerInitialize";
import { useFormattedTimer } from "@/hooks/question-detail/useFormattedTimer";
import { useInviteMismatchRedirect } from "@/hooks/question-page/useInviteMismatchRedirect";
import { useInviteEndQuestion } from "@/hooks/question-page/useInviteEndQuestion";
import { useInviteSessionRestore } from "@/hooks/question-page/useInviteSessionRestore";
import { QuestionTopBar } from "@/components/question/QuestionTopBar";
import { QuestionSpecModal } from "@/components/question/QuestionSpecModal";
import { ChatInput } from "@/components/question/ChatInput";
import type { SendPayload } from "@/components/question/ChatInput";
import { ChatPanel } from "@/components/question/ChatPanel";
import { PreviewPanel } from "@/components/question/PreviewPanel";
import { isInviteResponse } from "@/types/question-resolved";
import { useTRPCClient } from "@/lib/trpc/trpc";
import type { ChatAgentUIMessage } from "@/lib/agents/chat-agent";
import type { TimelineSnapshotSerialized } from "@/types/timeline";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense>
      <QuestionDetailContent params={params} />
    </Suspense>
  );
}

function QuestionDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");

  const trpc = useTRPCClient();
  const { data: resolved, isLoading, isError } = useQuestionById(id, inviteCode);

  const inviteContext = resolved && isInviteResponse(resolved) ? resolved.invite : null;

  // Question state from store
  const showModal = useQuestionStateStore((state) => state.showModal);
  const hasStarted = useQuestionStateStore((state) => state.hasStarted);
  const snapshots = useQuestionStateStore((state) => state.snapshots);
  const currentSnapshotId = useQuestionStateStore((state) => state.currentSnapshotId);
  const setShowModal = useQuestionStateStore((state) => state.setShowModal);
  const setHasStarted = useQuestionStateStore((state) => state.setHasStarted);
  const addProcessedToolCall = useQuestionStateStore((state) => state.addProcessedToolCall);

  // Timer state
  const startTimer = useTimerStore((state) => state.start);
  const pauseTimer = useTimerStore((state) => state.pause);
  const timerSeconds = useTimerStore((state) => state.seconds);
  const timerLimitSeconds = useTimerStore((state) => state.limitSeconds);
  const timerHardStop = useTimerStore((state) => state.hardStop);
  const timerFormatted = useFormattedTimer();
  const isTimedOut = hasStarted && timerHardStop && timerLimitSeconds !== null && timerSeconds >= timerLimitSeconds;

  // Sandbox state
  const sandboxId = useSandboxStore((state) => state.sandboxId);
  const sandboxUrl = useSandboxStore((state) => state.sandboxUrl);
  const files = useSandboxStore((state) => state.files);
  // Session state
  const updateFromMessages = useQuestionSessionStore((state) => state.updateFromMessages);
  const saveSession = useQuestionSessionStore((state) => state.saveSession);
  const initSession = useQuestionSessionStore((state) => state.initSession);
  const setSubmissionId = useQuestionSessionStore((state) => state.setSubmissionId);
  const testResultsSummary = useTestResultsStore((state) => state.summary);

  // Sandbox operations
  const {
    createSandbox,
    isCreating: sandboxLoading,
    createError: sandboxError,
    writeFiles,
    updateLocalFile,
  } = useSandbox();

  // Chat
  const { messages, setMessages, sendMessage, status, stop } = useChat<ChatAgentUIMessage>({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  // Mismatch redirect: if invite resolves to a different question than the URL
  useInviteMismatchRedirect(inviteCode, resolved?.question?.id, id);

  // Submission completion on end
  const markCompleted = useInviteEndQuestion(inviteCode, inviteContext, id);

  useEffect(() => {
    if (isError) router.replace('/questions');
  }, [isError, router]);

  useTimerInitialize(resolved?.question.timeConstraints);

  const restoreState = useInviteSessionRestore({
    inviteCode,
    questionId: id,
    enabled: Boolean(inviteCode && resolved && !hasStarted),
    setMessages,
  });

  useMessageTokenSync(messages, updateFromMessages);
  useToolCallFileSync({
    messages,
    sandboxUrl,
    addProcessedToolCall,
    updateLocalFile,
  });

  const { handleRevert, isReverting } = useCheckpoints({
    messages,
    status,
    writeFiles,
  });

  const handleStart = async () => {
    setShowModal(false);
    setHasStarted(true);
    startTimer();
    let inviteSubmissionId: string | null = null;

    if (resolved) {
      // Save submissionId before initSession wipes it (invite flow sets it on landing page)
      const existingSubmissionId = submissionId;
      initSession(resolved.question.id);

      if (inviteCode) {
        // Invite flow: restore the submission ID that was set on the landing page
        if (existingSubmissionId) {
          inviteSubmissionId = existingSubmissionId;
          setSubmissionId(existingSubmissionId);
        }
      } else {
        // Non-invite flow: create a submission so we can track tokens server-side
        trpc.submissions.create.mutate({ questionId: resolved.question.id })
          .then((sub) => setSubmissionId(sub.id))
          .catch((err) => Sentry.captureException(err));
      }
    }

    try {
      const sandbox = await createSandbox(resolved?.question.repository?.url ?? undefined);

      if (inviteSubmissionId) {
        await trpc.submissions.update.mutate({ id: inviteSubmissionId, data: { sandboxId: sandbox.sandboxId } });
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  // Auto-start when arriving via invite redirect (candidate already consented on invite page)
  useEffect(() => {
    if (inviteCode && resolved && !hasStarted && restoreState === 'none') {
      handleStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode, !!resolved, hasStarted, restoreState]);

  const submissionId = useQuestionSessionStore((state) => state.submissionId);
  const messageCount = useQuestionSessionStore((state) => state.messageCount);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEndQuestion = async () => {
    if (isSubmitting) return;
    if (!resolved) return;

    // Kept `true` through the redirect on success so the UI stays locked while
    // navigation completes; reset only on the error/no-op paths below.
    setIsSubmitting(true);
    pauseTimer();

    try {
      // Compute actual elapsed time (timerFormatted shows countdown when a limit is set)
      const elapsed = timerSeconds;
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      const elapsedFormatted = h > 0
        ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

      const serializedSnapshots: TimelineSnapshotSerialized[] = snapshots.map((s) => ({
        ...s,
        timestamp: s.timestamp instanceof Date ? s.timestamp.toISOString() : String(s.timestamp),
      }));

      const sessionPayload = {
        snapshots: serializedSnapshots,
        timeSpent: elapsedFormatted,
        timeExceeded: isTimedOut,
        messageCount,
      };

      saveSession(elapsedFormatted, isTimedOut, testResultsSummary);

      if (inviteCode) {
        // Invite flow: markCompleted handles submission + triggers background analysis via the session route
        await markCompleted(sessionPayload);
        router.push(`/invite/${inviteCode}/thank-you`);
      } else {
        // Non-invite flow: submit session data before routing so analysis can read from the backend.
        let activeSubmissionId = submissionId;

        if (!activeSubmissionId) {
          const submission = await trpc.submissions.create.mutate({ questionId: resolved.question.id }).catch(() => null);
          if (!submission) {
            toast.error("Failed to prepare your submission. Please try again.");
            setIsSubmitting(false);
            return;
          }

          activeSubmissionId = submission.id;
          setSubmissionId(submission.id);
        }

        const submitted = await trpc.submissions.submitSession.mutate({
            id: activeSubmissionId,
            data: {
              snapshots: serializedSnapshots,
              timeSpent: elapsedFormatted,
              timeExceeded: isTimedOut,
              messageCount,
            },
          }).catch(() => null);

        if (!submitted) {
          toast.error("Failed to submit your session. Please try again.");
          setIsSubmitting(false);
          return;
        }

        router.push(`/questions/${resolved.question.id}/analysis`);
      }
    } catch (err) {
      Sentry.captureException(err);
      toast.error("Something went wrong while submitting. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = ({ text, modelId, enableReasoning }: SendPayload) => {
    if (!text.trim() || !hasStarted) return;

    sendMessage(
      { text },
      {
        body: {
          currentFiles: files,
          modelId,
          sandboxId,
          enableReasoning,
          questionId: resolved?.question?.id,
          inviteCode,
          submissionId,
          elapsedSeconds: timerSeconds,
        },
      }
    );
  };

  if (isLoading || !resolved) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (restoreState === 'restoring') {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-6">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card px-8 py-10 text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Restoring your session...</h1>
            <p className="text-sm text-muted-foreground">
              Reconnecting to your sandbox and loading your previous progress.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (restoreState === 'expired') {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-6">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-card px-8 py-10 text-center shadow-sm">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Session expired</h1>
            <p className="text-sm text-muted-foreground">
              Your previous sandbox is no longer available, so this session cannot be restored.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const question = resolved.question;

  return (
    <div className="flex h-screen flex-col bg-background">
      <QuestionTopBar
        questionId={question.id}
        timerFormatted={timerFormatted}
        onShowSpec={() => setShowModal(true)}
        onEndQuestion={handleEndQuestion}
        hasStarted={hasStarted}
        hasChatHistory={messages.length > 0}
        isSubmitting={isSubmitting}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex w-1/2 flex-col border-r border-border">
          <ChatPanel
            messages={messages}
            isStreaming={status === "streaming"}
          />
          <div className="border-t border-border p-4">
            <ChatInput
              onSend={handleSendMessage}
              status={status}
              stop={stop}
              disabled={!hasStarted || isReverting || isTimedOut}
              allowedModels={question.aiPermissions.allowedModels}
            />
          </div>
        </div>

        <div className="w-1/2">
          <PreviewPanel
            role={question.role}
            isLoading={sandboxLoading}
            isReverting={isReverting}
            error={sandboxError}
          />
        </div>

        {isTimedOut && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 shadow-lg text-center max-w-sm">
              <div className="text-4xl">⏱️</div>
              <h2 className="text-xl font-semibold">Time&apos;s Up</h2>
              <p className="text-sm text-muted-foreground">
                Your time limit has been reached. Please submit your work.
              </p>
              <button
                onClick={handleEndQuestion}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>

      <QuestionSpecModal
        question={question}
        open={showModal}
        onStart={handleStart}
        onClose={() => setShowModal(false)}
        hasStarted={hasStarted}
      />
    </div>
  );
}
