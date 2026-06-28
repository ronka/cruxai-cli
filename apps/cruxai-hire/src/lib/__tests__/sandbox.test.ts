import { describe, it, expect, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@vercel/sandbox', () => ({ Sandbox: vi.fn() }));

import { normalizeSandboxPath, streamToString } from '@/lib/sandbox';

describe('normalizeSandboxPath', () => {
  it('strips /vercel/sandbox/ prefix', () => {
    expect(normalizeSandboxPath('/vercel/sandbox/src/index.ts')).toBe('src/index.ts');
  });

  it('strips ./ prefix', () => {
    expect(normalizeSandboxPath('./src/index.ts')).toBe('src/index.ts');
  });

  it('strips leading /', () => {
    expect(normalizeSandboxPath('/src/index.ts')).toBe('src/index.ts');
  });

  it('leaves already-clean paths unchanged', () => {
    expect(normalizeSandboxPath('src/index.ts')).toBe('src/index.ts');
  });

  it('handles empty string', () => {
    expect(normalizeSandboxPath('')).toBe('');
  });

  it('chains all prefix-stripping rules (vercel/sandbox/ then ./)', () => {
    expect(normalizeSandboxPath('/vercel/sandbox/./relative')).toBe('relative');
  });
});

describe('streamToString', () => {
  it('returns empty string for null input', async () => {
    expect(await streamToString(null)).toBe('');
  });

  it('returns empty string for an empty ReadableStream', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });
    expect(await streamToString(stream)).toBe('');
  });

  it('decodes a single-chunk ReadableStream', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('hello'));
        controller.close();
      },
    });
    expect(await streamToString(stream)).toBe('hello');
  });

  it('decodes a multi-chunk ReadableStream', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('foo'));
        controller.enqueue(encoder.encode('bar'));
        controller.enqueue(encoder.encode('baz'));
        controller.close();
      },
    });
    expect(await streamToString(stream)).toBe('foobarbaz');
  });

  it('handles a Node.js async iterable stream', async () => {
    async function* generate() {
      yield Buffer.from('chunk1');
      yield Buffer.from('chunk2');
    }
    const nodeStream = generate() as unknown as NodeJS.ReadableStream;
    expect(await streamToString(nodeStream)).toBe('chunk1chunk2');
  });

  it('handles an empty Node.js async iterable stream', async () => {
    async function* generate() {
      // yields nothing
    }
    const nodeStream = generate() as unknown as NodeJS.ReadableStream;
    expect(await streamToString(nodeStream)).toBe('');
  });
});
