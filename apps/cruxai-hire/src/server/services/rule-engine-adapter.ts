import type { Submission } from '@/types/recruiter';
import type { StoredMessage } from '@/types/stored-message';
import type { Session, SessionRequest } from '@/rule-engine/types';

const EXT_TO_LANG: Record<string, string> = {
  ts: 'TypeScript',
  tsx: 'TypeScript',
  js: 'JavaScript',
  jsx: 'JavaScript',
  py: 'Python',
  css: 'CSS',
  html: 'HTML',
  json: 'JSON',
};

function inferLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_LANG[ext] ?? 'Other';
}

function extractTextFromParts(msg: StoredMessage): string {
  const parts = msg.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('\n');
}

function extractAiCode(msg: StoredMessage): { aiCode: SessionRequest['aiCode']; editedFiles: string[] } {
  const parts = msg.parts;
  if (!Array.isArray(parts)) return { aiCode: [], editedFiles: [] };

  const editedFiles: string[] = [];
  const locByLanguage: Record<string, number> = {};

  for (const part of parts) {
    const type = part.type;
    if (type !== 'tool-updateCode') continue;
    const p = part as { input?: { filePath?: string; code?: string }; output?: { filePath?: string; code?: string } };
    const filePath = p.output?.filePath ?? p.input?.filePath ?? '';
    const code = p.output?.code ?? p.input?.code ?? '';
    if (filePath) editedFiles.push(filePath);
    if (code && filePath) {
      const lang = inferLanguage(filePath);
      locByLanguage[lang] = (locByLanguage[lang] ?? 0) + code.split('\n').length;
    }
  }

  const aiCode = Object.entries(locByLanguage).map(([language, loc]) => ({ language, loc }));
  return { aiCode, editedFiles };
}

export function submissionToSession(submission: Submission): Session {
  const messages = submission.chatMessages ?? [];

  const userElapsedByIndex = new Map<number, number>();
  for (let i = 0; i < messages.length; i++) {
    const e = messages[i].elapsedSeconds;
    if (messages[i].role === 'user' && e != null) userElapsedByIndex.set(i, e);
  }

  const requests: SessionRequest[] = [];
  let prevElapsed: number | undefined;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'user') continue;

    const messageText = extractTextFromParts(msg);
    const nextMsg = messages[i + 1];
    const elapsed = userElapsedByIndex.get(i);
    const turnElapsedMs = elapsed != null
      ? (prevElapsed != null ? elapsed - prevElapsed : elapsed) * 1000
      : null;

    const assistantMsg = nextMsg?.role === 'assistant' ? nextMsg : null;
    const { aiCode } = assistantMsg
      ? extractAiCode(assistantMsg)
      : { aiCode: [] };

    const assistantModelId = assistantMsg?.modelId ?? '';
    const isCanceled = msg.aborted ?? false;

    if (elapsed != null) prevElapsed = elapsed;

    requests.push({
      messageText,
      messageLength: messageText.length,
      isCanceled,
      totalElapsed: turnElapsedMs,
      modelId: assistantModelId,
      aiCode,
    });
  }

  return { requests };
}
