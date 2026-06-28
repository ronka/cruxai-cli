import { create } from 'zustand';
import type { TimelineSnapshot, TimelineSnapshotKind, TimelineSnapshotSerialized } from '@/types/timeline';

interface QuestionStateState {
  // State
  showModal: boolean;
  hasStarted: boolean;
  processedToolCalls: Set<string>;
  snapshots: TimelineSnapshot[];
  currentSnapshotId: string | null;

  // Actions
  setShowModal: (show: boolean) => void;
  setHasStarted: (started: boolean) => void;
  hydrate: (data: {
    snapshots: TimelineSnapshotSerialized[];
    processedToolCalls: Iterable<string>;
  }) => void;
  addProcessedToolCall: (id: string) => void;
  addSnapshot: (
    kind: TimelineSnapshotKind,
    files: Record<string, string>,
    opts?: { afterMessageId?: string; revertedToId?: string }
  ) => string;
  setCurrentSnapshotId: (id: string | null) => void;
  getSnapshot: (id: string) => TimelineSnapshot | undefined;
  reset: () => void;
}

function generateId(): string {
  return `snap-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export const useQuestionStateStore = create<QuestionStateState>((set, get) => ({
  // Initial state
  showModal: true,
  hasStarted: false,
  processedToolCalls: new Set<string>(),
  snapshots: [],
  currentSnapshotId: null,

  // Actions
  setShowModal: (show) => set({ showModal: show }),

  setHasStarted: (started) => set({ hasStarted: started }),

  hydrate: ({ snapshots, processedToolCalls }) =>
    set({
      showModal: false,
      hasStarted: true,
      processedToolCalls: new Set(processedToolCalls),
      snapshots: snapshots.map((snapshot) => ({
        ...snapshot,
        timestamp: new Date(snapshot.timestamp),
      })),
      currentSnapshotId: null,
    }),

  addProcessedToolCall: (id) =>
    set((state) => ({
      processedToolCalls: new Set(state.processedToolCalls).add(id),
    })),

  addSnapshot: (kind, files, opts = {}) => {
    const timestamp = new Date();
    const snapshot: TimelineSnapshot = {
      id: generateId(),
      kind,
      timestamp,
      label: formatTimestamp(timestamp),
      files: { ...files },
      afterMessageId: opts.afterMessageId ?? null,
      ...(opts.revertedToId !== undefined && { revertedToId: opts.revertedToId }),
    };

    set((state) => ({
      snapshots: [...state.snapshots, snapshot],
    }));

    return snapshot.id;
  },

  setCurrentSnapshotId: (id) => set({ currentSnapshotId: id }),

  getSnapshot: (id) => get().snapshots.find((s) => s.id === id),

  reset: () =>
    set({
      showModal: true,
      hasStarted: false,
      processedToolCalls: new Set<string>(),
      snapshots: [],
      currentSnapshotId: null,
    }),
}));
