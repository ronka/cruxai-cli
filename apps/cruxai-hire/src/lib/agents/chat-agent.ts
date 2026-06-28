import {
  ToolLoopAgent,
  stepCountIs,
  type LanguageModel,
  type InferAgentUIMessage,
  type GenerateTextOnStepFinishCallback,
} from "ai";
import { createListFilesTool, createReadFilesTool, createUpdateCodeTool } from "@/server/tools";

function createChatTools(currentFiles: Record<string, string>, sandboxId?: string) {
  return {
    listFiles: createListFilesTool(currentFiles),
    readFiles: createReadFilesTool(currentFiles),
    updateCode: createUpdateCodeTool(sandboxId),
  };
}

type ChatTools = ReturnType<typeof createChatTools>;

export type ChatAgentUIMessage = InferAgentUIMessage<ToolLoopAgent<never, ChatTools>>;

export function createChatAgent(options: {
  model: LanguageModel;
  instructions: string;
  currentFiles: Record<string, string>;
  sandboxId?: string;
  supportsReasoning?: boolean;
  onStepFinish?: GenerateTextOnStepFinishCallback<ChatTools>;
}) {
  const tools = createChatTools(options.currentFiles, options.sandboxId);
  return new ToolLoopAgent({
    model: options.model,
    instructions: options.instructions,
    tools,
    stopWhen: stepCountIs(20),
    ...(options.onStepFinish && { onStepFinish: options.onStepFinish }),
    ...(options.supportsReasoning && {
      providerOptions: {
        anthropic: { thinking: { type: "enabled", budgetTokens: 10000 } },
        google: { thinkingConfig: { includeThoughts: true, thinkingBudget: 10000 } },
      },
    }),
  });
}
