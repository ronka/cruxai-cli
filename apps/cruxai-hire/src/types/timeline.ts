export type TimelineSnapshotKind = 'snapshot-ai' | 'snapshot-manual' | 'snapshot-revert';

export interface TimelineSnapshot {
  id: string;
  kind: TimelineSnapshotKind;
  timestamp: Date;
  label: string;
  files: Record<string, string>;
  afterMessageId: string | null;   // null for standalone (manual/revert)
  revertedToId?: string;           // for snapshot-revert: which snapshot was restored
}

// Serialized form as stored in JSONB — timestamps are strings after JSON round-trip
export type TimelineSnapshotSerialized = Omit<TimelineSnapshot, 'timestamp'> & { timestamp: string };
