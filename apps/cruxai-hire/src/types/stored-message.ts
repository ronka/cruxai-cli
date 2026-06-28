import type { UIMessage } from 'ai';

export type StoredMessage = UIMessage & {
  elapsedSeconds?: number;
  modelId?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
  aborted?: boolean;
};
