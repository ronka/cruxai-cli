import { describe, it, expect } from 'vitest';
import { createRuleEngine } from '../index';
import { PRACTICE_GROUPS } from '../types';
import type { Session, SessionRequest } from '../types';
import { rules } from '@/rules/rules';

function mkRequest(partial: Partial<SessionRequest> = {}): SessionRequest {
  const messageText = partial.messageText ?? 'add a feature with full context and detail';
  return {
    messageText,
    messageLength: partial.messageLength ?? messageText.length,
    isCanceled: partial.isCanceled ?? false,
    totalElapsed: partial.totalElapsed ?? 5000,
    modelId: partial.modelId ?? 'openai/gpt-4o-mini',
    aiCode: partial.aiCode ?? [],
  };
}

function mkSession(requests: SessionRequest[]): Session {
  return { requests };
}

function findingFor(ruleId: string, session: Session) {
  const engine = createRuleEngine({ rules });
  return engine.analyzeOne(session, ruleId);
}

describe('rule contract', () => {
  it('every rule id is unique', () => {
    const ids = rules.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every rule belongs to a known practice group', () => {
    for (const rule of rules) {
      expect(PRACTICE_GROUPS).toContain(rule.group);
    }
  });
});

describe('lazy-prompting', () => {
  it('fires when more than 30% of prompts are under 30 chars', () => {
    const s = mkSession([
      mkRequest({ messageText: 'hi' }),
      mkRequest({ messageText: 'help me' }),
      mkRequest({ messageText: 'plz' }),
      mkRequest({ messageText: 'this is a detailed prompt about my task and constraints' }),
    ]);
    const f = findingFor('lazy-prompting', s);
    expect(f).not.toBeNull();
    expect(f!.occurrences).toBe(3);
  });

  it('does not fire on well-formed prompts', () => {
    const s = mkSession([
      mkRequest({ messageText: 'please add a new endpoint with proper validation and tests' }),
      mkRequest({ messageText: 'now wire the endpoint to the database layer carefully' }),
    ]);
    expect(findingFor('lazy-prompting', s)).toBeNull();
  });
});

describe('caps-lock', () => {
  it('fires when any prompt is >=10 chars and >=90% caps', () => {
    const s = mkSession([
      mkRequest({ messageText: 'WHY ISNT THIS WORKING ANYMORE' }),
    ]);
    const f = findingFor('caps-lock', s);
    expect(f).not.toBeNull();
    expect(f!.occurrences).toBe(1);
  });

  it('does not fire on normal-case prompts', () => {
    const s = mkSession([
      mkRequest({ messageText: 'why isnt this working anymore' }),
    ]);
    expect(findingFor('caps-lock', s)).toBeNull();
  });
});

describe('frustration-signals', () => {
  it('fires on repeated punctuation or rage words', () => {
    const s = mkSession([
      mkRequest({ messageText: 'this is broken!!!' }),
      mkRequest({ messageText: 'wtf is going on???' }),
    ]);
    const f = findingFor('frustration-signals', s);
    expect(f).not.toBeNull();
    expect(f!.occurrences).toBeGreaterThanOrEqual(2);
  });

  it('does not fire on calm prompts', () => {
    const s = mkSession([
      mkRequest({ messageText: 'the test fails on line 5; can you check it?' }),
      mkRequest({ messageText: 'thanks, also please look at the helper function' }),
    ]);
    expect(findingFor('frustration-signals', s)).toBeNull();
  });
});

describe('repeated-prompts', () => {
  it('fires when the same prompt appears at least 3 times', () => {
    const s = mkSession([
      mkRequest({ messageText: 'fix the bug please' }),
      mkRequest({ messageText: 'fix the bug please' }),
      mkRequest({ messageText: 'fix the bug please' }),
      mkRequest({ messageText: 'something else entirely now' }),
    ]);
    const f = findingFor('repeated-prompts', s);
    expect(f).not.toBeNull();
    expect(f!.occurrences).toBeGreaterThanOrEqual(3);
  });

  it('does not fire on distinct prompts', () => {
    const s = mkSession([
      mkRequest({ messageText: 'add authentication module' }),
      mkRequest({ messageText: 'wire up the dashboard now' }),
      mkRequest({ messageText: 'fix the typo in the readme' }),
    ]);
    expect(findingFor('repeated-prompts', s)).toBeNull();
  });
});

describe('high-cancellation', () => {
  it('fires when >15% of requests are cancelled', () => {
    const s = mkSession([
      mkRequest({ isCanceled: true }),
      mkRequest({ isCanceled: true }),
      mkRequest({ isCanceled: false }),
      mkRequest({ isCanceled: false }),
    ]);
    const f = findingFor('high-cancellation', s);
    expect(f).not.toBeNull();
    expect(f!.occurrences).toBe(2);
  });

  it('does not fire when no requests are cancelled', () => {
    const s = mkSession([mkRequest(), mkRequest(), mkRequest()]);
    expect(findingFor('high-cancellation', s)).toBeNull();
  });
});

describe('slow-responses', () => {
  it('fires when more than 3 responses exceed 2 minutes', () => {
    const s = mkSession([
      mkRequest({ totalElapsed: 200000 }),
      mkRequest({ totalElapsed: 130000 }),
      mkRequest({ totalElapsed: 130000 }),
      mkRequest({ totalElapsed: 130000 }),
    ]);
    const f = findingFor('slow-responses', s);
    expect(f).not.toBeNull();
    expect(f!.occurrences).toBe(4);
  });

  it('does not fire on fast responses', () => {
    const s = mkSession([
      mkRequest({ totalElapsed: 5000 }),
      mkRequest({ totalElapsed: 10000 }),
    ]);
    expect(findingFor('slow-responses', s)).toBeNull();
  });
});

describe('vibe-coding', () => {
  it('fires when AI generates >=100 LoC from <=8 prompts', () => {
    const s = mkSession([
      mkRequest({ aiCode: [{ language: 'TypeScript', loc: 60 }] }),
      mkRequest({ aiCode: [{ language: 'TypeScript', loc: 60 }] }),
    ]);
    const f = findingFor('vibe-coding', s);
    expect(f).not.toBeNull();
  });

  it('does not fire when AI LoC is low', () => {
    const s = mkSession([
      mkRequest({ aiCode: [{ language: 'TypeScript', loc: 10 }] }),
    ]);
    expect(findingFor('vibe-coding', s)).toBeNull();
  });
});

describe('premium-waste', () => {
  it('fires when more than 5 short prompts use premium models with no code output', () => {
    const s = mkSession(
      Array.from({ length: 6 }, () =>
        mkRequest({ messageText: 'thx', messageLength: 3, modelId: 'anthropic/claude-3-7-sonnet', aiCode: [] }),
      ),
    );
    const f = findingFor('premium-waste', s);
    expect(f).not.toBeNull();
    expect(f!.occurrences).toBe(6);
  });

  it('does not fire on cheap-model usage', () => {
    const s = mkSession(
      Array.from({ length: 6 }, () =>
        mkRequest({ messageText: 'hi', modelId: 'openai/gpt-4o-mini' }),
      ),
    );
    expect(findingFor('premium-waste', s)).toBeNull();
  });
});
