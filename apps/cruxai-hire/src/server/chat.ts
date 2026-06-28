import { after } from "next/server";
import { createAgentUIStreamResponse, gateway, type UIMessage } from "ai";
import { createChatAgent } from "@/lib/agents/chat-agent";
import { getSystemPrompt } from "./prompts";
import { getDefaultModel, getModelById } from "@/lib/models";
import { incrementTokenUsage, saveChatMessages } from "@/server/services/submissions";
import type { StoredMessage } from "@/types/stored-message";

export interface ChatUsage {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
}

function stampMessages(
    messages: UIMessage[],
    modelId: string,
    usage: ChatUsage,
    aborted: boolean,
): StoredMessage[] {
    const stamped: StoredMessage[] = messages.map(m => m as StoredMessage);
    let assistantStamped = false;
    let userStamped = !aborted;
    for (let i = stamped.length - 1; i >= 0 && (!assistantStamped || !userStamped); i--) {
        if (!assistantStamped && stamped[i].role === 'assistant') {
            stamped[i] = {
                ...stamped[i],
                modelId,
                usage: {
                    inputTokens: usage.inputTokens,
                    outputTokens: usage.outputTokens,
                    cacheReadTokens: usage.cacheReadTokens || undefined,
                    cacheWriteTokens: usage.cacheWriteTokens || undefined,
                },
            };
            assistantStamped = true;
        } else if (!userStamped && stamped[i].role === 'user') {
            stamped[i] = { ...stamped[i], aborted: true };
            userStamped = true;
        }
    }
    return stamped;
}

export interface HandleChatRequestArgs {
    messages: UIMessage[];
    currentFiles: Record<string, string>;
    modelId?: string;
    sandboxId?: string;
    enableReasoning?: boolean;
    submissionId?: string;
    elapsedSeconds?: number;
}

export async function handleChatRequest(args: HandleChatRequestArgs) {
    const {
        messages,
        currentFiles,
        modelId,
        sandboxId,
        enableReasoning,
        submissionId,
        elapsedSeconds,
    } = args;

    const selectedModelId = modelId ?? getDefaultModel().id;
    const modelConfig = getModelById(selectedModelId);

    const model = gateway(selectedModelId);

    const systemPrompt = getSystemPrompt();

    const reasoningActive = (modelConfig?.supportsReasoning ?? false) && (enableReasoning ?? false);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCacheWriteTokens = 0;

    const persist = submissionId !== undefined;

    const agent = createChatAgent({
        model,
        instructions: systemPrompt,
        currentFiles,
        sandboxId,
        supportsReasoning: reasoningActive,
        onStepFinish: persist
            ? (step) => {
                totalInputTokens += step.usage?.inputTokens ?? 0;
                totalOutputTokens += step.usage?.outputTokens ?? 0;
                totalCacheReadTokens += step.usage?.inputTokenDetails?.cacheReadTokens ?? 0;
                totalCacheWriteTokens += step.usage?.inputTokenDetails?.cacheWriteTokens ?? 0;
            }
            : undefined,
    });

    return createAgentUIStreamResponse({
        agent,
        uiMessages: messages,
        sendReasoning: reasoningActive,
        onFinish: persist
            ? (event) => {
                const usage: ChatUsage = {
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens,
                    cacheReadTokens: totalCacheReadTokens,
                    cacheWriteTokens: totalCacheWriteTokens,
                };
                const stamped = stampMessages(event.messages, selectedModelId, usage, event.isAborted);
                after(() => incrementTokenUsage(submissionId, usage.inputTokens, usage.outputTokens));
                after(() => saveChatMessages(submissionId, stamped, elapsedSeconds));
              }
            : undefined,
    });
}
