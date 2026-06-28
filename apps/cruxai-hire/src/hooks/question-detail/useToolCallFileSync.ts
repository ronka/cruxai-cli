import { useEffect } from "react";
import type { ChatAgentUIMessage } from "@/lib/agents/chat-agent";
import { useQuestionStateStore } from "@/stores/questionStateStore";

type UseToolCallFileSyncParams = {
  messages: ChatAgentUIMessage[];
  sandboxUrl: string | null;
  addProcessedToolCall: (toolCallId: string) => void;
  updateLocalFile: (filePath: string, content: string) => void;
};

export function useToolCallFileSync({
  messages,
  sandboxUrl,
  addProcessedToolCall,
  updateLocalFile,
}: UseToolCallFileSyncParams) {
  useEffect(() => {
    if (!sandboxUrl) return;

    for (const message of messages) {
      if (message.role !== "assistant" || !message.parts) continue;

      for (const part of message.parts) {
        if (part.type === "tool-updateCode" && part.state === "output-available") {
          const toolCallId = part.toolCallId;
          if (!toolCallId) continue;

          const currentProcessedToolCalls = useQuestionStateStore.getState().processedToolCalls;
          if (currentProcessedToolCalls.has(toolCallId)) continue;

          addProcessedToolCall(toolCallId);

          const { filePath, code } = part.output;
          if (filePath && code) {
            updateLocalFile(filePath, code);
          }
        }
      }
    }
  }, [messages, sandboxUrl, addProcessedToolCall, updateLocalFile]);
}
