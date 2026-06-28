import { describe, it, expect } from 'vitest';
import { messageInsightSchema, analysisResponseSchema } from '@/server/analysisSchema';

const validInsight = {
  messageIndex: 0,
  intent: 'implementation',
  quality: 'strong',
  flags: ['exemplar'],
  reasoning: 'Well-structured approach.',
};

const validPayload = {
  messageInsights: [validInsight],
};

describe('messageInsightSchema', () => {
  it('parses a fully valid insight', () => {
    expect(() => messageInsightSchema.parse(validInsight)).not.toThrow();
  });

  it('rejects missing messageIndex', () => {
    const { messageIndex: _, ...rest } = validInsight;
    expect(() => messageInsightSchema.parse(rest)).toThrow();
  });

  it('rejects missing intent', () => {
    const { intent: _, ...rest } = validInsight;
    expect(() => messageInsightSchema.parse(rest)).toThrow();
  });

  it('rejects missing quality', () => {
    const { quality: _, ...rest } = validInsight;
    expect(() => messageInsightSchema.parse(rest)).toThrow();
  });

  it('rejects missing flags', () => {
    const { flags: _, ...rest } = validInsight;
    expect(() => messageInsightSchema.parse(rest)).toThrow();
  });

  it('rejects missing reasoning', () => {
    const { reasoning: _, ...rest } = validInsight;
    expect(() => messageInsightSchema.parse(rest)).toThrow();
  });

  it('rejects invalid intent enum value', () => {
    expect(() => messageInsightSchema.parse({ ...validInsight, intent: 'chitchat' })).toThrow();
  });

  it('rejects invalid quality enum value', () => {
    expect(() => messageInsightSchema.parse({ ...validInsight, quality: 'excellent' })).toThrow();
  });

  it('rejects invalid flag enum value', () => {
    expect(() => messageInsightSchema.parse({ ...validInsight, flags: ['invalid-flag'] })).toThrow();
  });

  it('accepts empty flags array', () => {
    expect(() => messageInsightSchema.parse({ ...validInsight, flags: [] })).not.toThrow();
  });

  it('rejects negative messageIndex', () => {
    expect(() => messageInsightSchema.parse({ ...validInsight, messageIndex: -1 })).toThrow();
  });

  it('rejects non-integer messageIndex', () => {
    expect(() => messageInsightSchema.parse({ ...validInsight, messageIndex: 1.5 })).toThrow();
  });

  it('strips extra fields (Zod default behavior)', () => {
    const result = messageInsightSchema.parse({ ...validInsight, unknownField: 'ignored' });
    expect((result as Record<string, unknown>).unknownField).toBeUndefined();
  });

  it('accepts all valid intent values', () => {
    const intents = ['clarification', 'requirement', 'implementation', 'debugging', 'follow-up', 'review', 'other'];
    for (const intent of intents) {
      expect(() => messageInsightSchema.parse({ ...validInsight, intent })).not.toThrow();
    }
  });

  it('accepts all valid quality values', () => {
    for (const quality of ['strong', 'adequate', 'weak']) {
      expect(() => messageInsightSchema.parse({ ...validInsight, quality })).not.toThrow();
    }
  });

  it('accepts all valid flag values', () => {
    const flags = ['exemplar', 'red-flag', 'teaching-moment'];
    expect(() => messageInsightSchema.parse({ ...validInsight, flags })).not.toThrow();
  });
});

describe('analysisResponseSchema', () => {
  it('parses a fully valid analysis payload', () => {
    expect(() => analysisResponseSchema.parse(validPayload)).not.toThrow();
  });

  it('accepts empty messageInsights array', () => {
    expect(() => analysisResponseSchema.parse({ messageInsights: [] })).not.toThrow();
  });

  it('rejects missing messageInsights field', () => {
    expect(() => analysisResponseSchema.parse({})).toThrow();
  });

  it('rejects invalid insight inside messageInsights', () => {
    expect(() =>
      analysisResponseSchema.parse({ messageInsights: [{ ...validInsight, intent: 'bad' }] })
    ).toThrow();
  });

  it('accepts multiple valid insights', () => {
    const payload = {
      messageInsights: [
        { ...validInsight, messageIndex: 0 },
        { ...validInsight, messageIndex: 1, intent: 'clarification', flags: [] },
      ],
    };
    expect(() => analysisResponseSchema.parse(payload)).not.toThrow();
  });
});
