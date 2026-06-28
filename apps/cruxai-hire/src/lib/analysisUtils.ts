import type { UIMessage } from "@ai-sdk/react";
import type { TimelineSnapshot } from "@/types/timeline";
import type { SystemMessageForAPI } from "@/server/analysisSchema";

export function extractMessageContent(message: UIMessage): string {
  if (message.parts) {
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join(" ");
  }
  return "";
}

export function simplifyMessages(messages: UIMessage[]): Array<{ role: string; content: string }> {
  return messages.map((m) => ({
    role: m.role,
    content: extractMessageContent(m),
  }));
}

export function snapshotsToSystemMessages(
  snapshots: TimelineSnapshot[],
  messages: UIMessage[]
): SystemMessageForAPI[] {
  const messageIdToIndex = new Map<string, number>();
  messages.forEach((m, i) => {
    messageIdToIndex.set(m.id, i);
  });

  return snapshots.map((snap) => {
    const afterMessageIndex =
      snap.afterMessageId !== null
        ? (messageIdToIndex.get(snap.afterMessageId) ?? messages.length - 1)
        : messages.length - 1;

    if (snap.kind === "snapshot-revert") {
      return {
        type: "checkpoint-reverted" as const,
        timestamp: snap.timestamp.toISOString(),
        label: snap.label,
        afterMessageIndex,
      };
    }

    return {
      type: "checkpoint-created" as const,
      timestamp: snap.timestamp.toISOString(),
      label: snap.label,
      afterMessageIndex,
      isManualEdit: snap.kind === "snapshot-manual",
    };
  });
}
