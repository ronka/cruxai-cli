export interface Model {
  id: string;
  label: string;
  supportsReasoning: boolean;
}

export const SUPPORTED_MODELS = [
  {
    id: "openai/gpt-4.1",
    label: "GPT-4.1",
    supportsReasoning: false,
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    supportsReasoning: false,
  },
  {
    id: "google/gemini-3-flash",
    label: "Gemini 3 Flash",
    supportsReasoning: true,
  },
  {
    id: "anthropic/claude-3-7-sonnet",
    label: "Claude 3.7 Sonnet",
    supportsReasoning: true,
  },
] satisfies Model[];

export type SupportedModel = (typeof SUPPORTED_MODELS)[number];

export function getModelById(id: string): SupportedModel | undefined {
  return SUPPORTED_MODELS.find((model) => model.id === id);
}

export function getDefaultModel(): SupportedModel {
  return SUPPORTED_MODELS[0];
}

// §4.7: shared resolver — returns the model matching `modelId` or the default if none matches.
export function resolveModel(modelId?: string): SupportedModel {
  if (modelId) {
    return getModelById(modelId) ?? getDefaultModel();
  }
  return getDefaultModel();
}
