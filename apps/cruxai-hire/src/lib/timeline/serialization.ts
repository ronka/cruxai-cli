import type { TimelineSnapshot, TimelineSnapshotSerialized } from "@/types/timeline";

export function deserializeSnapshots(serialized: TimelineSnapshotSerialized[]): TimelineSnapshot[] {
  return serialized.map((s) => ({
    ...s,
    timestamp: new Date(s.timestamp),
  }));
}
