import { useEffect } from "react";
import type { UIMessage } from "@ai-sdk/react";

export function useMessageTokenSync(
  messages: UIMessage[],
  updateFromMessages: (messages: UIMessage[]) => void,
) {
  useEffect(() => {
    updateFromMessages(messages);
  }, [messages, updateFromMessages]);
}
