/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* Provider-agnostic, fetch-based LLM client. Runs in both Node (key from env)
 * and the browser (key passed at construction). Supports Anthropic and
 * OpenAI-compatible endpoints behind the same interface. */

import type { JsonSchemaSpec } from './skill-finder';

// ─── Public interface ─────────────────────────────────────────────────────────

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmClient {
  complete(messages: LlmMessage[]): Promise<string>;
  completeJson<T>(messages: LlmMessage[], schema: JsonSchemaSpec): Promise<T>;
}

// ─── Factory options ──────────────────────────────────────────────────────────

export interface AnthropicClientOptions {
  /** Required in browser contexts; falls back to ANTHROPIC_API_KEY env var in Node. */
  apiKey?: string;
  /** Defaults to claude-sonnet-4-6. Override via ANTHROPIC_MODEL env var or this field. */
  model?: string;
  /** Set to true when running in a browser context that calls the API directly.
   *  Adds the anthropic-dangerous-direct-browser-access header required by Anthropic. */
  directBrowserAccess?: boolean;
}

export interface OpenAiCompatibleClientOptions {
  apiKey: string;
  /** Defaults to https://api.openai.com/v1 */
  baseUrl?: string;
  model: string;
}

// ─── JSON repair helper (shared, also used by extension via panel-llm.ts) ────

export function parseLlmJson<T>(text: string): T {
  let cleaned = text.trim();
  cleaned = cleaned.replaceAll(/^```(?:json|jsonc|jsonl)?\s*/gm, '').replaceAll(/```\s*$/gm, '').trim();
  cleaned = cleaned.replaceAll(/^\s*\/\/[^\n]*$/gm, '');

  const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 1 && lines.every(l => l.startsWith('{') && l.endsWith('}'))) {
    const jsonlArray = '[' + lines.join(',') + ']';
    try { return JSON.parse(jsonlArray) as T; } catch { /* fall through */ }
  }

  const arrStart = cleaned.indexOf('[');
  const objStart = cleaned.indexOf('{');
  if (arrStart === -1 && objStart === -1) throw new Error('No JSON structure found in LLM response');

  let start: number;
  if (arrStart === -1) start = objStart;
  else if (objStart === -1) start = arrStart;
  else start = Math.min(arrStart, objStart);

  const openChar = cleaned[start];
  const closeChar = openChar === '[' ? ']' : '}';
  const end = cleaned.lastIndexOf(closeChar);
  if (end <= start) throw new Error('Malformed JSON structure in LLM response');

  cleaned = cleaned.slice(start, end + 1);

  try { return JSON.parse(cleaned) as T; } catch { /* fall through */ }

  let fixed = cleaned;
  fixed = fixed.replaceAll(/,\s*([}\]])/g, '$1');
  fixed = fixed.replaceAll(/[“”″]/g, '"').replaceAll(/[‘’′]/g, "'");
  fixed = fixed.replaceAll(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
  // eslint-disable-next-line no-control-regex
  fixed = fixed.replaceAll(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  try { return JSON.parse(fixed) as T; } catch { /* fall through */ }

  const balanced = balanceTruncatedJson(fixed).replaceAll(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(balanced) as T; } catch { /* fall through */ }

  throw new Error('Failed to parse JSON from LLM response');
}

function balanceTruncatedJson(input: string): string {
  const closers: string[] = [];
  let inString = false;
  let escaped = false;

  for (const char of input) {
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') closers.push('}');
    else if (char === '[') closers.push(']');
    else if (char === '}' || char === ']') closers.pop();
  }

  let result = input;
  if (inString) result += '"';
  for (let i = closers.length - 1; i >= 0; i--) result += closers[i];
  return result;
}

// ─── Anthropic client ─────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;
const MAX_RETRIES = 2;

function resolveAnthropicKey(options?: AnthropicClientOptions): string {
  const key = options?.apiKey ?? (typeof process !== 'undefined' ? process.env['ANTHROPIC_API_KEY'] : undefined);
  if (!key) {
    throw new Error(
      'ANTHROPIC_API_KEY is required. ' +
      'Set the environment variable and retry:\n  export ANTHROPIC_API_KEY=sk-ant-...',
    );
  }
  return key;
}

function resolveAnthropicModel(options?: AnthropicClientOptions): string {
  return options?.model
    ?? (typeof process !== 'undefined' ? process.env['ANTHROPIC_MODEL'] : undefined)
    ?? DEFAULT_ANTHROPIC_MODEL;
}

export function createAnthropicClient(options?: AnthropicClientOptions): LlmClient {
  const apiKey = resolveAnthropicKey(options);
  const model = resolveAnthropicModel(options);
  const directBrowser = options?.directBrowserAccess ?? false;

  const baseHeaders: Record<string, string> = {
    'x-api-key': apiKey,
    'anthropic-version': ANTHROPIC_VERSION,
    'content-type': 'application/json',
  };
  if (directBrowser) {
    baseHeaders['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  async function callApi(body: Record<string, unknown>): Promise<unknown> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(body),
      });
      if (response.ok) {
        return await response.json();
      }
      const errorText = await response.text().catch(() => response.statusText);
      lastError = new Error(`Anthropic API error ${response.status}: ${errorText}`);
      // Retry on transient errors; bail immediately on auth/bad request
      if (response.status === 401 || response.status === 400) break;
    }
    throw lastError;
  }

  return {
    async complete(messages: LlmMessage[]): Promise<string> {
      const body = {
        model,
        max_tokens: MAX_TOKENS,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      };
      const data = await callApi(body) as { content?: Array<{ type: string; text?: string }> };
      const textBlock = data.content?.find(block => block.type === 'text');
      if (!textBlock?.text) throw new Error('No text content in Anthropic response');
      return textBlock.text;
    },

    async completeJson<T>(messages: LlmMessage[], schema: JsonSchemaSpec): Promise<T> {
      // Use tool use to get structured JSON output from Anthropic
      const body = {
        model,
        max_tokens: MAX_TOKENS,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        tools: [{
          name: schema.name,
          description: `Return a structured JSON response matching the ${schema.name} schema.`,
          input_schema: schema.schema,
        }],
        tool_choice: { type: 'tool', name: schema.name },
      };

      let lastError: unknown;
      let parseFailures = 0;
      const retryMessages = [...messages];

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const response = await fetch(ANTHROPIC_API_URL, {
          method: 'POST',
          headers: baseHeaders,
          body: JSON.stringify({ ...body, messages: retryMessages.map(m => ({ role: m.role, content: m.content })) }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          lastError = new Error(`Anthropic API error ${response.status}: ${errorText}`);
          if (response.status === 401 || response.status === 400) break;
          continue;
        }

        const data = await response.json() as {
          content?: Array<{ type: string; input?: unknown; text?: string }>;
          stop_reason?: string;
        };

        // Tool use response
        const toolBlock = data.content?.find(block => block.type === 'tool_use');
        if (toolBlock?.input !== undefined) {
          const input = toolBlock.input;
          if (typeof input === 'object' && input !== null) return input as T;
          if (typeof input === 'string') {
            try { return JSON.parse(input) as T; } catch { /* fall through */ }
          }
        }

        // Fallback: text response — attempt JSON parse
        const textBlock = data.content?.find(block => block.type === 'text');
        if (textBlock?.text) {
          try {
            return JSON.parse(textBlock.text.trim()) as T;
          } catch {
            try {
              return parseLlmJson<T>(textBlock.text);
            } catch (e) {
              lastError = e;
              parseFailures++;
              retryMessages.push({
                role: 'user',
                content: 'Your previous response was not valid JSON. Please respond ONLY with a valid JSON object or array, no markdown fences, no commentary.',
              });
            }
          }
        }
      }

      const label = parseFailures > 0
        ? `LLM returned invalid JSON after ${MAX_RETRIES + 1} attempts. Please try again.`
        : (lastError instanceof Error ? lastError.message : 'LLM request failed after retries');
      throw new Error(label);
    },
  };
}

// ─── OpenAI-compatible client ─────────────────────────────────────────────────

const OPENAI_DEFAULT_BASE = 'https://api.openai.com/v1';

export function createOpenAiCompatibleClient(options: OpenAiCompatibleClientOptions): LlmClient {
  const { apiKey, model } = options;
  const baseUrl = (options.baseUrl ?? OPENAI_DEFAULT_BASE).replace(/\/$/, '');

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'content-type': 'application/json',
  };

  return {
    async complete(messages: LlmMessage[]): Promise<string> {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        throw new Error(`OpenAI API error ${response.status}: ${text}`);
      }
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content in OpenAI response');
      return content;
    },

    async completeJson<T>(messages: LlmMessage[], schema: JsonSchemaSpec): Promise<T> {
      const body = {
        model,
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: { name: schema.name, strict: true, schema: schema.schema },
        },
      };
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => response.statusText);
        throw new Error(`OpenAI API error ${response.status}: ${text}`);
      }
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content in OpenAI response');
      try { return JSON.parse(content) as T; } catch { return parseLlmJson<T>(content); }
    },
  };
}

// ─── Auto-detect factory ──────────────────────────────────────────────────────

/** Create a client by inspecting environment variables. Anthropic takes priority. */
export function createLlmClientFromEnv(): LlmClient {
  if (typeof process !== 'undefined') {
    const anthropicKey = process.env['ANTHROPIC_API_KEY'];
    if (anthropicKey) return createAnthropicClient({ apiKey: anthropicKey });

    const openaiKey = process.env['OPENAI_API_KEY'];
    if (openaiKey) {
      const model = process.env['OPENAI_MODEL'] ?? 'gpt-4.1-mini';
      const baseUrl = process.env['OPENAI_BASE_URL'];
      return createOpenAiCompatibleClient({ apiKey: openaiKey, model, baseUrl });
    }
  }
  throw new Error(
    'No LLM API key found. Set ANTHROPIC_API_KEY (preferred) or OPENAI_API_KEY and retry.',
  );
}
