import * as Sentry from "@sentry/nextjs";
import { useEffect, useRef, useState } from "react";
import type { ChatAgentUIMessage } from "@/lib/agents/chat-agent";
import { useTRPCClient } from "@/lib/trpc/trpc";
import { useQuestionSessionStore } from "@/stores/questionSessionStore";
import { useQuestionStateStore } from "@/stores/questionStateStore";
import { useTimerStore } from "@/stores/timerStore";
import { useSandbox } from "@/hooks/useSandbox";

export type InviteSessionRestoreState = "idle" | "restoring" | "restored" | "none" | "expired";

function extractProcessedToolCallIds(messages: ChatAgentUIMessage[]): string[] {
  const toolCallIds = new Set<string>();

  for (const message of messages) {
    if (!message.parts) continue;

    for (const part of message.parts) {
      if ("toolCallId" in part && typeof part.toolCallId === "string") {
        toolCallIds.add(part.toolCallId);
      }
    }
  }

  return [...toolCallIds];
}

export function useInviteSessionRestore({
  inviteCode,
  questionId,
  enabled,
  setMessages,
}: {
  inviteCode: string | null;
  questionId: string;
  enabled: boolean;
  setMessages: (messages: ChatAgentUIMessage[]) => void;
}) {
  const trpc = useTRPCClient();
  const initSession = useQuestionSessionStore((state) => state.initSession);
  const setSubmissionId = useQuestionSessionStore((state) => state.setSubmissionId);
  const hydrateQuestionState = useQuestionStateStore((state) => state.hydrate);
  const initializeWithElapsed = useTimerStore((state) => state.initializeWithElapsed);
  const { reconnectSandbox } = useSandbox();
  const [restoreState, setRestoreState] = useState<InviteSessionRestoreState>(
    inviteCode ? "idle" : "none"
  );
  const restoreStateRef = useRef(restoreState);

  useEffect(() => {
    restoreStateRef.current = restoreState;
  }, [restoreState]);

  useEffect(() => {
    setRestoreState(inviteCode ? "idle" : "none");
  }, [inviteCode, questionId]);

  useEffect(() => {
    if (!inviteCode || !enabled || restoreStateRef.current !== "idle") {
      return;
    }

    const inviteCodeToRestore = inviteCode;
    let cancelled = false;

    async function restoreSession() {
      try {
        const session = await trpc.invites.session.query({ code: inviteCodeToRestore }).catch((error) => {
          Sentry.captureException(error);
          return null;
        });

        if (cancelled) {
          return;
        }

        if (!session || session.status === "none") {
          setRestoreState("none");
          return;
        }

        setRestoreState("restoring");
        await reconnectSandbox(session.sandboxId);

        if (cancelled) return;

        const restoredMessages = session.chatMessages as ChatAgentUIMessage[];
        const elapsedSeconds = Math.max(
          0,
          Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000)
        );

        initSession(questionId);
        setSubmissionId(session.submissionId);
        setMessages(restoredMessages);
        hydrateQuestionState({
          snapshots: session.snapshots,
          processedToolCalls: extractProcessedToolCallIds(restoredMessages),
        });
        initializeWithElapsed(elapsedSeconds);
        setRestoreState("restored");
      } catch (error) {
        if (!cancelled) {
          Sentry.captureException(error);
          setRestoreState("expired");
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    hydrateQuestionState,
    initSession,
    initializeWithElapsed,
    inviteCode,
    questionId,
    reconnectSandbox,
    setMessages,
    setSubmissionId,
    trpc,
  ]);

  return restoreState;
}
