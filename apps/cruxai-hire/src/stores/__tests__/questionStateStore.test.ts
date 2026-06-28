import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useQuestionStateStore } from '@/stores/questionStateStore';
import type { TimelineSnapshotSerialized } from '@/types/timeline';

beforeEach(() => {
  useQuestionStateStore.getState().reset();
});

describe('questionStateStore', () => {
  describe('reset', () => {
    it('returns all state to initial values', () => {
      useQuestionStateStore.getState().setHasStarted(true);
      useQuestionStateStore.getState().setShowModal(false);
      useQuestionStateStore.getState().addProcessedToolCall('tc-1');
      useQuestionStateStore.getState().reset();

      const s = useQuestionStateStore.getState();
      expect(s.showModal).toBe(true);
      expect(s.hasStarted).toBe(false);
      expect(s.processedToolCalls.size).toBe(0);
      expect(s.snapshots).toEqual([]);
      expect(s.currentSnapshotId).toBeNull();
    });
  });

  describe('addSnapshot', () => {
    it('builds correct structure with kind, files copy, and afterMessageId', () => {
      const files = { '/index.ts': 'console.log("hi")' };
      const id = useQuestionStateStore.getState().addSnapshot('snapshot-ai', files, { afterMessageId: 'msg-1' });

      const snapshot = useQuestionStateStore.getState().getSnapshot(id);
      expect(snapshot).toBeDefined();
      expect(snapshot!.kind).toBe('snapshot-ai');
      expect(snapshot!.afterMessageId).toBe('msg-1');
      expect(snapshot!.files).toEqual(files);
      expect(snapshot!.files).not.toBe(files); // must be a copy
    });

    it('sets afterMessageId to null when not provided', () => {
      const id = useQuestionStateStore.getState().addSnapshot('snapshot-manual', {});
      const snapshot = useQuestionStateStore.getState().getSnapshot(id);
      expect(snapshot!.afterMessageId).toBeNull();
    });

    it('stores revertedToId when provided', () => {
      const id = useQuestionStateStore.getState().addSnapshot('snapshot-revert', {}, { revertedToId: 'snap-old' });
      const snapshot = useQuestionStateStore.getState().getSnapshot(id);
      expect(snapshot!.revertedToId).toBe('snap-old');
    });

    it('timestamp is a Date object', () => {
      const id = useQuestionStateStore.getState().addSnapshot('snapshot-ai', {});
      const snapshot = useQuestionStateStore.getState().getSnapshot(id);
      expect(snapshot!.timestamp).toBeInstanceOf(Date);
    });

    it('returns a unique ID each call', () => {
      const id1 = useQuestionStateStore.getState().addSnapshot('snapshot-ai', {});
      const id2 = useQuestionStateStore.getState().addSnapshot('snapshot-ai', {});
      expect(id1).not.toBe(id2);
    });
  });

  describe('getSnapshot', () => {
    it('retrieves the right snapshot by ID', () => {
      const id1 = useQuestionStateStore.getState().addSnapshot('snapshot-ai', { '/a.ts': 'a' });
      const id2 = useQuestionStateStore.getState().addSnapshot('snapshot-manual', { '/b.ts': 'b' });

      expect(useQuestionStateStore.getState().getSnapshot(id1)!.files).toEqual({ '/a.ts': 'a' });
      expect(useQuestionStateStore.getState().getSnapshot(id2)!.files).toEqual({ '/b.ts': 'b' });
    });

    it('returns undefined for an unknown ID', () => {
      expect(useQuestionStateStore.getState().getSnapshot('not-a-real-id')).toBeUndefined();
    });
  });

  describe('insertion order', () => {
    it('maintains insertion order after multiple addSnapshot calls', () => {
      const ids = ['snapshot-ai', 'snapshot-manual', 'snapshot-revert'].map((kind) =>
        useQuestionStateStore.getState().addSnapshot(kind as 'snapshot-ai', {})
      );
      const storedIds = useQuestionStateStore.getState().snapshots.map((s) => s.id);
      expect(storedIds).toEqual(ids);
    });
  });

  describe('hydrate', () => {
    it('restores snapshots and converts timestamp strings to Date objects', () => {
      const isoTime = '2026-04-14T10:00:00.000Z';
      const serialized: TimelineSnapshotSerialized[] = [
        {
          id: 'snap-1',
          kind: 'snapshot-ai',
          timestamp: isoTime,
          label: '10:00 AM',
          files: { '/app.ts': 'code' },
          afterMessageId: 'msg-1',
        },
      ];

      useQuestionStateStore.getState().hydrate({ snapshots: serialized, processedToolCalls: [] });

      const s = useQuestionStateStore.getState();
      expect(s.hasStarted).toBe(true);
      expect(s.showModal).toBe(false);
      expect(s.snapshots[0].timestamp).toBeInstanceOf(Date);
      expect(s.snapshots[0].timestamp.toISOString()).toBe(isoTime);
    });

    it('restores processedToolCalls from iterable', () => {
      useQuestionStateStore.getState().hydrate({
        snapshots: [],
        processedToolCalls: ['tc-1', 'tc-2'],
      });
      const { processedToolCalls } = useQuestionStateStore.getState();
      expect(processedToolCalls.has('tc-1')).toBe(true);
      expect(processedToolCalls.has('tc-2')).toBe(true);
    });

    it('clears currentSnapshotId on hydrate', () => {
      useQuestionStateStore.setState({ currentSnapshotId: 'some-id' });
      useQuestionStateStore.getState().hydrate({ snapshots: [], processedToolCalls: [] });
      expect(useQuestionStateStore.getState().currentSnapshotId).toBeNull();
    });
  });

  describe('addProcessedToolCall', () => {
    it('adds IDs without duplicates', () => {
      useQuestionStateStore.getState().addProcessedToolCall('tc-1');
      useQuestionStateStore.getState().addProcessedToolCall('tc-1');
      useQuestionStateStore.getState().addProcessedToolCall('tc-2');
      expect(useQuestionStateStore.getState().processedToolCalls.size).toBe(2);
      expect(useQuestionStateStore.getState().processedToolCalls.has('tc-1')).toBe(true);
      expect(useQuestionStateStore.getState().processedToolCalls.has('tc-2')).toBe(true);
    });
  });
});
