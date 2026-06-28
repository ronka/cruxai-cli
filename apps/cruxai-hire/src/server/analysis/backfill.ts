import type { MessageInsight } from "@/server/analysisSchema";

interface SimpleMessage {
  role: string;
}

// Ensures every user-message index has an insight; mutates and re-sorts the input array.
export function backfillUserInsights(messageInsights: MessageInsight[], messages: SimpleMessage[]): MessageInsight[] {
  const insightsByIndex = new Map(messageInsights.map((i) => [i.messageIndex, i]));
  for (let idx = 0; idx < messages.length; idx++) {
    if (messages[idx].role === "user" && !insightsByIndex.has(idx)) {
      messageInsights.push({
        messageIndex: idx,
        intent: "follow-up",
        quality: "adequate",
        flags: [],
        reasoning: "No specific classification available.",
      });
    }
  }
  messageInsights.sort((a, b) => a.messageIndex - b.messageIndex);
  return messageInsights;
}
