import * as Sentry from "@sentry/nextjs";
import { useEffect, useRef, useState } from "react";
import type { UIMessage } from "ai";
import { useQuestionStateStore } from "@/stores/questionStateStore";
import { useSandboxStore } from "@/stores/sandboxStore";

interface UseCheckpointsOptions {
  messages: UIMessage[];
  status: string;
  writeFiles: (files: Record<string, string>, deleteOthers?: boolean) => Promise<Record<string, string>>;
}

export function useCheckpoints({
  messages,
  status,
  writeFiles,
}: UseCheckpointsOptions) {
  const addSnapshot = useQuestionStateStore((state) => state.addSnapshot);
  const getSnapshot = useQuestionStateStore((state) => state.getSnapshot);
  const setCurrentSnapshotId = useQuestionStateStore((state) => state.setCurrentSnapshotId);

  const [isReverting, setIsReverting] = useState(false);
  const prevStatusRef = useRef(status);

  // Create snapshot when assistant response completes (streaming -> ready)
  useEffect(() => {
    if (prevStatusRef.current === "streaming" && status === "ready" && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        const currentFiles = useSandboxStore.getState().files;
        const snapshotId = addSnapshot("snapshot-ai", currentFiles, {
          afterMessageId: lastMessage.id,
        });
        setCurrentSnapshotId(snapshotId);
      }
    }
    prevStatusRef.current = status;
  }, [status, messages, addSnapshot, setCurrentSnapshotId]);

  // Handle reverting to a snapshot
  const handleRevert = async (targetId: string) => {
    const targetSnapshot = getSnapshot(targetId);
    if (!targetSnapshot) return;

    setIsReverting(true);
    const currentFiles = useSandboxStore.getState().files;
    const lastMessage = messages[messages.length - 1];

    try {
      // First snapshot the current state as a revert event (enables undo)
      // Attach to the last message so the revert label renders inline chronologically
      addSnapshot("snapshot-revert", currentFiles, {
        revertedToId: targetId,
        afterMessageId: lastMessage?.id ?? null,
      });

      // Optimistically update local files so the editor reflects the revert immediately
      useSandboxStore.getState().setFiles(targetSnapshot.files);

      // Restore files in the sandbox — deleteOthers removes files added after the checkpoint
      await writeFiles(targetSnapshot.files, true);

      // Update current snapshot indicator
      setCurrentSnapshotId(targetId);
    } catch (error) {
      Sentry.captureException(error);
      // Roll back the optimistic update on failure
      useSandboxStore.getState().setFiles(currentFiles);
      console.error("Failed to revert to snapshot:", error);
    } finally {
      setIsReverting(false);
    }
  };

  return {
    handleRevert,
    isReverting,
  };
}
