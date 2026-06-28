import type { AIModelConfig, TestFrameworkType } from '@/types/question-shared';

export const availableLLMModels: AIModelConfig[] = [
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'openai', description: 'OpenAI GPT-4.1' },
  // { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'OpenAI GPT-4o Mini' },
  { id: 'google/gemini-3-flash', name: 'Gemini 3 Flash', provider: 'google', description: 'Google Gemini 3 Flash' },
  // { id: 'anthropic/claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'anthropic', description: 'Anthropic Claude 3.7 Sonnet' },
];

export const availableTestFrameworks: Array<{ id: TestFrameworkType; name: string; language: string }> = [
  { id: 'jest', name: 'Jest', language: 'javascript' },
  { id: 'vitest', name: 'Vitest', language: 'javascript' },
  { id: 'mocha', name: 'Mocha', language: 'javascript' },
  { id: 'pytest', name: 'Pytest', language: 'python' },
];
