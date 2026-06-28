'use client';

import { useState } from "react";
import { Brain } from "lucide-react";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputTools,
  PromptInputTextarea,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputSelect,
  PromptInputSelectTrigger,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectValue,
} from "@/components/ai-elements/prompt-input";
import { SUPPORTED_MODELS, getDefaultModel, getModelById } from "@/lib/models";
import type { ChatStatus } from "ai";

export interface SendPayload {
  text: string;
  modelId: string;
  enableReasoning: boolean;
}

interface ChatInputProps {
  onSend: (payload: SendPayload) => void;
  status?: ChatStatus;
  disabled?: boolean;
  stop?: () => void;
  allowedModels?: string[];
}

export function ChatInput({ onSend, status, disabled, stop, allowedModels }: ChatInputProps) {
  const availableModels =
    allowedModels && allowedModels.length > 0
      ? SUPPORTED_MODELS.filter((m) => allowedModels.includes(m.id))
      : SUPPORTED_MODELS;

  const defaultModelId = (availableModels[0] ?? getDefaultModel()).id;
  const [selectedModelId, setSelectedModelId] = useState<string>(defaultModelId);
  const [enableReasoning, setEnableReasoning] = useState(
    () => getModelById(defaultModelId)?.supportsReasoning ?? false,
  );

  const selectedModel = getModelById(selectedModelId);

  const handleModelChange = (value: string) => {
    setSelectedModelId(value);
    const model = getModelById(value);
    setEnableReasoning(model?.supportsReasoning ?? false);
  };

  return (
    <PromptInput
      onSubmit={({ text }) => {
        if (status === "streaming") {
          stop?.();
          return;
        }
        if (!text.trim()) return;
        onSend({ text, modelId: selectedModelId, enableReasoning });
      }}
    >
      <PromptInputTextarea
        placeholder="Describe what you want to build or change"
        className="min-h-[100px]"
        disabled={disabled}
      />
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputSelect value={selectedModelId} onValueChange={handleModelChange}>
            <PromptInputSelectTrigger disabled={disabled} className="text-xs h-7">
              <PromptInputSelectValue />
            </PromptInputSelectTrigger>
            <PromptInputSelectContent>
              {availableModels.map((model) => (
                <PromptInputSelectItem key={model.id} value={model.id}>
                  {model.label}
                </PromptInputSelectItem>
              ))}
            </PromptInputSelectContent>
          </PromptInputSelect>

          {selectedModel?.supportsReasoning && (
            <PromptInputButton
              variant={enableReasoning ? "default" : "ghost"}
              onClick={() => setEnableReasoning((prev) => !prev)}
              disabled={disabled}
              tooltip="Toggle reasoning"
            >
              <Brain className="size-4" />
            </PromptInputButton>
          )}
        </PromptInputTools>

        <PromptInputSubmit status={status} onStop={stop} disabled={disabled} />
      </PromptInputFooter>
    </PromptInput>
  );
}
