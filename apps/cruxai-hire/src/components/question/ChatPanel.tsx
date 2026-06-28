// TODO: Checkpoint UI (CheckpointFooter, StandaloneCheckpoint, onRevert, isReverting, snapshots,
// currentSnapshotId) has been removed from this component as it was unreachable dead UI.
// The useCheckpoints data pipeline remains wired in page.tsx — snapshots still record and
// serialize at session end. Re-add this UI when checkpoint/revert is re-enabled.

import DiffMatchPatch from "text-diff";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { FileCode, Loader2, Sparkles } from "lucide-react";
import type { ChatAgentUIMessage } from "@/lib/agents/chat-agent";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import { Tool, ToolHeader, ToolContent, ToolOutput } from "@/components/ai-elements/tool";
import { usePageCloseWarning } from "@/hooks/chat/usePageCloseWarning";

type DiffSegment = {
  kind: "equal" | "insert" | "delete";
  text: string;
};

const diffMatchPatch = new DiffMatchPatch({ timeout: 0.2 });

function buildDiffSegments(previousCode: string, nextCode: string): DiffSegment[] {
  const diffs = diffMatchPatch.main(previousCode, nextCode);
  diffMatchPatch.cleanupSemantic(diffs);

  return diffs
    .filter(([, text]) => text.length > 0)
    .map(([operation, text]) => ({
      kind: operation === 1 ? "insert" : operation === -1 ? "delete" : "equal",
      text,
    }));
}

type UpdateCodePartData = {
  state: string;
  input?: { filePath?: string };
  output?: {
    filePath?: string;
    code?: string;
    previousCode?: string;
  };
  toolCallId?: string;
};

function UpdateCodePart({ part }: { part: UpdateCodePartData }) {
  const filePath = part.output?.filePath ?? part.input?.filePath;
  const previousCode = part.output?.previousCode ?? "";
  const code = part.output?.code ?? "";
  const diffSegments = useMemo(
    () => buildDiffSegments(previousCode, code),
    [previousCode, code],
  );

  const title =
    part.state === "input-streaming" || part.state === "input-available"
      ? `Updating ${filePath}...`
      : part.state === "output-error"
        ? `Error updating ${filePath}`
        : `Updated ${filePath}`;

  const diffOutput =
    part.state === "output-available" ? (
      <div className="max-h-64 overflow-auto rounded-md border border-border/50 bg-background/60 p-3 font-mono text-xs">
        {diffSegments.length > 0 ? (
          <pre className="whitespace-pre text-foreground">
            {diffSegments.map((segment, index) => (
              <span
                key={`${segment.kind}-${index}`}
                className={cn(
                  segment.kind === "insert" &&
                    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                  segment.kind === "delete" &&
                    "bg-red-500/15 text-red-700 dark:text-red-300",
                )}
              >
                {segment.text}
              </span>
            ))}
          </pre>
        ) : (
          <div className="text-muted-foreground">No textual changes.</div>
        )}
      </div>
    ) : undefined;

  return (
    <Tool>
      <ToolHeader
        title={title}
        type="tool-updateCode"
        state={
          part.state === "input-streaming" || part.state === "input-available"
            ? "input-available"
            : part.state === "output-error"
              ? "output-error"
              : "output-available"
        }
      />
      {diffOutput && (
        <ToolContent>
          <ToolOutput output={diffOutput} errorText={undefined} />
        </ToolContent>
      )}
    </Tool>
  );
}

interface ChatPanelProps {
  messages: ChatAgentUIMessage[];
  isStreaming?: boolean;
}

export function ChatPanel({ messages, isStreaming = false }: ChatPanelProps) {
  usePageCloseWarning(messages.length > 0);

  return (
    <Conversation className="flex-1">
      <ConversationContent>
        {messages.length === 0 ? (
          <ConversationEmptyState
            icon={<Sparkles className="size-6" />}
            title="Start chatting"
            description="Ask the AI assistant to help you build your solution."
          />
        ) : (
          messages.map((message) => {
            // Consolidate all reasoning parts into one block, rendered before text/tool parts
            const reasoningParts = message.parts?.filter((p) => p.type === "reasoning") ?? [];
            const nonReasoningParts = message.parts?.filter((p) => p.type !== "reasoning") ?? [];
            const isReasoningStreaming =
              isStreaming && reasoningParts.some((p) => (p as { state?: string }).state === "streaming");

            return (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {reasoningParts.length > 0 && (
                    <Reasoning isStreaming={isReasoningStreaming}>
                      <ReasoningTrigger />
                      <ReasoningContent>
                        {reasoningParts.map((p) => (p as { text: string }).text).join("")}
                      </ReasoningContent>
                    </Reasoning>
                  )}

                  {nonReasoningParts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <MessageResponse key={index}>
                          {part.text}
                        </MessageResponse>
                      );
                    }
                    if (part.type === "tool-updateCode") {
                      return (
                        <UpdateCodePart
                          key={(part as UpdateCodePartData).toolCallId ?? index}
                          part={part as UpdateCodePartData}
                        />
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            );
          })
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
