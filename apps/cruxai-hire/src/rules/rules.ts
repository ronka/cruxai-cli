import type { Rule, RuleFinding, RuleSeverity, Session, SessionRequest } from '@/rule-engine/types';

// Dropped rules (inherently cross-session, no single-session equivalent):
//   no-spec-driven-development — references all sessions' spec-driven rate
//   mega-sessions — scope: sessions, needs requestCount session field
//   broken-flow-state — flowScoreStats requires multiple sessions
//   no-language-exploration — langExplorationWeeks needs multi-session history
//   low-markdown-ratio — mdRatioByWorkspace requires multiple sessions
//   speed-accept — adjacentPairCount spans sessions
//   abandon-sessions — multi-session concept
//   weekend-overwork — multi-session temporal pattern
//   copy-paste-blindness — multi-session pattern
//
// Dropped rules (no capturable signal from candidate UX):
//   yolo-mode, auto-approve-terminal, no-slash-commands, no-custom-instructions,
//   no-file-context, reasoning-effort-overuse (binary toggle made it tautological)

const PREMIUM_MODEL_IDS = new Set<string>([
  'anthropic/claude-3-7-sonnet',
]);

function modelTier(modelId: string): number {
  return PREMIUM_MODEL_IDS.has(modelId) ? 1 : 0;
}

function normalizeModel(modelId: string): string {
  const slash = modelId.lastIndexOf('/');
  return slash >= 0 ? modelId.slice(slash + 1) : modelId;
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '...' : s;
}

function capsLetterRatio(text: string): number {
  let letters = 0, upper = 0;
  for (let i = 0, len = Math.min(text.length, 2000); i < len; i++) {
    const code = text.charCodeAt(i);
    if (code >= 65 && code <= 90) { letters++; upper++; }
    else if (code >= 97 && code <= 122) { letters++; }
  }
  return letters > 0 ? upper / letters : 0;
}

function capsWordRatio(text: string, minLen: number): number {
  let wordLen = 0, wordCount = 0, capsWordCount = 0, allUpper = true, hasLetter = false;
  for (let i = 0, len = Math.min(text.length, 2000); i <= len; i++) {
    const code = i < len ? text.charCodeAt(i) : 32;
    if (code === 32 || code === 9 || code === 10 || code === 13) {
      if (wordLen >= minLen) { wordCount++; if (allUpper && hasLetter) capsWordCount++; }
      wordLen = 0; allUpper = true; hasLetter = false;
    } else {
      wordLen++;
      if (code >= 65 && code <= 90) hasLetter = true;
      else if (code >= 97 && code <= 122) allUpper = false;
    }
  }
  return wordCount > 0 ? capsWordCount / wordCount : 0;
}

// Near-duplicate clustering on message text. Two messages cluster if they share a normalized prefix.
function findDuplicateGroups(
  requests: SessionRequest[],
  prefixLen: number,
  minSize: number,
): { totalDupes: number; distinctCount: number; examples: SessionRequest[] } {
  const groups = new Map<string, SessionRequest[]>();
  for (const r of requests) {
    if (r.messageLength <= 0) continue;
    const key = r.messageText.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, prefixLen);
    if (!key) continue;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  let totalDupes = 0;
  let distinctCount = 0;
  const examples: SessionRequest[] = [];
  for (const arr of groups.values()) {
    if (arr.length >= minSize) {
      totalDupes += arr.length;
      distinctCount += 1;
      if (examples.length < 3) examples.push(arr[0]);
    }
  }
  return { totalDupes, distinctCount, examples };
}

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

function sumAiLoc(requests: SessionRequest[]): number {
  let total = 0;
  for (const r of requests) for (const b of r.aiCode) total += b.loc;
  return total;
}

function mkFinding(
  rule: Rule,
  occurrences: number,
  total: number,
  description: string,
  suggestion: string,
  examples: string[],
  severity?: RuleSeverity,
): RuleFinding {
  return {
    ruleId: rule.id,
    name: rule.name,
    severity: severity ?? rule.severity,
    group: rule.group,
    scope: rule.scope,
    occurrences,
    total,
    ratio: total > 0 ? occurrences / total : 0,
    description,
    suggestion,
    examples,
  };
}

const FRUSTRATION_PATTERNS = [
  /!{3,}/,
  /\?{3,}/,
  /\b(wtf|come on|why won't)\b/i,
  /\b(this is broken|doesn't work)\b/i,
];

export const rules: Rule[] = [
  {
    id: 'lazy-prompting',
    name: 'Lazy Prompting',
    group: 'prompt-quality',
    severity: 'medium',
    scope: 'requests',
    description: 'Detects requests with very short prompts that lack context.',
    detect(session, rule) {
      const minChars = 30, maxRatio = 0.1;
      const total = session.requests.length;
      const matched = session.requests.filter(r => r.messageLength > 0 && r.messageLength < minChars);
      if (total === 0) return null;
      const ratio = matched.length / total;
      if (ratio <= maxRatio) return null;
      return mkFinding(
        rule,
        matched.length,
        total,
        `${matched.length} requests (${pct(ratio)}) are under ${minChars} characters.`,
        'Provide more context in your prompts: describe the intent, constraints, and expected output format.',
        matched.slice(0, 3).map(r => `"${truncate(r.messageText, 80)}" (${r.messageLength} chars)`),
      );
    },
  },

  {
    id: 'caps-lock',
    name: 'Caps Lock Rage',
    group: 'prompt-quality',
    severity: 'medium',
    scope: 'requests',
    description: 'Detects requests written mostly or entirely in CAPS LOCK, indicating high frustration.',
    detect(session, rule) {
      const minLength = 10, capsRate = 0.9, minReqs = 1;
      const matched = session.requests.filter(r =>
        r.messageLength >= minLength && capsLetterRatio(r.messageText) >= capsRate,
      );
      if (matched.length < minReqs) return null;
      return mkFinding(
        rule,
        matched.length,
        session.requests.length,
        `${matched.length} requests are written mostly or entirely in CAPS LOCK, indicating high frustration.`,
        'All-caps messages signal frustration. Step away, take a breath, then return with a calm, structured prompt.',
        matched.slice(0, 3).map(r => `"${truncate(r.messageText, 80)}"`),
      );
    },
  },

  {
    id: 'frustration-signals',
    name: 'Frustration Signals',
    group: 'prompt-quality',
    severity: 'medium',
    scope: 'requests',
    description: 'Detects requests showing frustration indicators like excessive punctuation or ALL CAPS writing.',
    detect(session, rule) {
      const capsRate = 0.4, minWords = 3, minReqs = 2;
      const matched = session.requests.filter(r => {
        if (r.messageLength < 10) return false;
        if (FRUSTRATION_PATTERNS.some(p => p.test(r.messageText))) return true;
        return capsWordRatio(r.messageText, minWords) >= capsRate;
      });
      if (matched.length < minReqs) return null;
      return mkFinding(
        rule,
        matched.length,
        session.requests.length,
        `${matched.length} requests show frustration indicators (excessive punctuation, ALL CAPS).`,
        'When frustrated, step back and change strategy. Start a new session, rephrase the problem, or break it into smaller pieces.',
        matched.slice(0, 3).map(r => `"${truncate(r.messageText, 80)}"`),
      );
    },
  },

  {
    id: 'repeated-prompts',
    name: 'Repeated Prompts',
    group: 'prompt-quality',
    severity: 'medium',
    scope: 'requests',
    description: 'Detects near-duplicate prompts that waste quota without producing new results.',
    detect(session, rule) {
      const minDuplicates = 2, highThreshold = 10;
      const total = session.requests.length;
      const { totalDupes, distinctCount, examples } = findDuplicateGroups(session.requests, 10, minDuplicates);
      if (totalDupes < minDuplicates) return null;
      const severity: RuleSeverity = totalDupes > highThreshold ? 'high' : rule.severity;
      return mkFinding(
        rule,
        totalDupes,
        total,
        `${totalDupes} requests are near-duplicates across ${distinctCount} distinct prompts. This wastes quota without new results.`,
        `If a prompt isn't working, rephrase it or provide more context instead of retrying the same message.`,
        examples.map(r => `"${truncate(r.messageText, 60)}"`),
        severity,
      );
    },
  },

  {
    id: 'high-cancellation',
    name: 'Excessive Cancellations',
    group: 'session-hygiene',
    severity: 'medium',
    scope: 'requests',
    description: 'Detects a high rate of cancelled requests, which wastes premium quota and indicates unclear prompting.',
    detect(session, rule) {
      const maxCancelRate = 0.15;
      const total = session.requests.length;
      if (total === 0) return null;
      const matched = session.requests.filter(r => r.isCanceled);
      const ratio = matched.length / total;
      if (ratio <= maxCancelRate) return null;
      return mkFinding(
        rule,
        matched.length,
        total,
        `${matched.length} of ${total} requests cancelled (${pct(ratio)}). This wastes premium quota.`,
        'Write clearer, more specific prompts. Wait for responses instead of cancelling prematurely.',
        matched.slice(0, 3).map(r => `"${truncate(r.messageText, 80)}"`),
      );
    },
  },

  {
    id: 'slow-responses',
    name: 'Slow Responses',
    group: 'session-hygiene',
    severity: 'low',
    scope: 'requests',
    description: 'Detects requests with unusually long response times, which may indicate overly broad or complex prompts.',
    detect(session, rule) {
      const slowMs = 120000, minCount = 1;
      const matched = session.requests.filter(r => r.totalElapsed != null && r.totalElapsed > slowMs);
      if (matched.length <= minCount) return null;
      return mkFinding(
        rule,
        matched.length,
        session.requests.length,
        `${matched.length} requests took over 2 minutes. May indicate overly broad prompts.`,
        'Break complex tasks into smaller, focused requests. Use lighter models for simple questions.',
        matched.slice(0, 3).map(r => `"${truncate(r.messageText, 50)}"`),
      );
    },
  },

  {
    id: 'vibe-coding',
    name: 'Vibe Coding',
    group: 'code-review',
    severity: 'high',
    scope: 'session',
    description: 'High AI code output from minimal prompts indicates velocity without understanding.',
    detect(session, rule) {
      const minAiLoc = 100, maxUserPrompts = 8;
      const aiLoc = sumAiLoc(session.requests);
      const userPrompts = session.requests.length;
      if (aiLoc < minAiLoc || userPrompts > maxUserPrompts) return null;
      return mkFinding(
        rule,
        1,
        1,
        `This session generated ${aiLoc} AI LoC from only ${userPrompts} prompts.`,
        'Pause and review what was generated. Write a short spec before the next session.',
        [],
      );
    },
  },

  {
    id: 'premium-waste',
    name: 'Premium Model Waste',
    group: 'tool-mastery',
    severity: 'medium',
    scope: 'requests',
    description: 'Detects simple requests that use premium models unnecessarily.',
    detect(session, rule) {
      const minSample = 5, maxMessageLength = 50;
      const matched = session.requests.filter(r =>
        modelTier(r.modelId) >= 1 &&
        r.messageLength > 0 &&
        r.messageLength < maxMessageLength &&
        r.aiCode.length === 0,
      );
      if (matched.length <= minSample) return null;
      return mkFinding(
        rule,
        matched.length,
        session.requests.length,
        `${matched.length} simple requests (short prompt, no code output) used premium models.`,
        'Use lighter models for quick questions and simple tasks. Reserve premium models for complex code generation.',
        matched.slice(0, 3).map(r => `${normalizeModel(r.modelId)}: "${truncate(r.messageText, 50)}"`),
      );
    },
  },
];
