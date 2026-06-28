import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPCClient } from "@/lib/trpc/trpc";
import { useSandboxStore } from "@/stores/sandboxStore";
// TODO: REMOVE IN PRODUCTION - Import settings store for debug mode
import { useSettingsStore } from "@/stores/settingsStore";

interface SandboxData {
  sandboxId: string;
  url: string;
  files: Record<string, string>;
}

interface WriteFileParams {
  filePath: string;
  content: string;
}

interface WriteFilesParams {
  files: Record<string, string>;
  deleteOthers?: boolean;
}

class SandboxReconnectError extends Error {
  constructor(message: string, readonly code: 'sandbox_expired' | 'sandbox_reconnect_failed') {
    super(message);
    this.name = 'SandboxReconnectError';
  }
}

export function useSandbox() {
  const trpc = useTRPCClient();
  const { setSandboxData, updateFile, setFiles, bumpPreviewKey } = useSandboxStore();

  // TODO: REMOVE IN PRODUCTION - Get debug mode settings
  const debugMode = useSettingsStore((state) => state.debugMode);
  const hasDebugSandbox = useSettingsStore((state) => state.hasDebugSandbox());
  const debugSandbox = useSettingsStore((state) => state.debugSandbox);
  const setDebugSandbox = useSettingsStore((state) => state.setDebugSandbox);
  const clearDebugSandbox = useSettingsStore((state) => state.clearDebugSandbox);

  const createMutation = useMutation<SandboxData, Error, string | undefined>({
    mutationFn: async (repositoryUrl?: string): Promise<SandboxData> => {
      // TODO: REMOVE IN PRODUCTION - Check if debug mode enabled with cached sandbox
      if (debugMode && hasDebugSandbox && debugSandbox && debugSandbox.sandboxId && debugSandbox.url) {
        console.log('[DEBUG MODE] Reusing cached sandbox:', debugSandbox.sandboxId);
        return { sandboxId: debugSandbox.sandboxId, url: debugSandbox.url, files: debugSandbox.files };
      }
      console.log(debugMode ? '[DEBUG MODE] No cached sandbox, creating new one' : 'Creating new sandbox');
      return trpc.sandbox.create.mutate({ repositoryUrl });
    },
    onSuccess: (data) => {
      setSandboxData({ sandboxId: data.sandboxId, url: data.url, files: data.files });
      // TODO: REMOVE IN PRODUCTION - Cache sandbox if debug mode enabled
      if (debugMode) {
        console.log('[DEBUG MODE] Caching sandbox for reuse:', data.sandboxId);
        setDebugSandbox({ sandboxId: data.sandboxId, url: data.url, files: data.files });
      }
    },
    onError: (error) => {
      // TODO: REMOVE IN PRODUCTION - Clear cache on error (sandbox may be stale)
      if (debugMode && hasDebugSandbox) {
        console.warn('[DEBUG MODE] Sandbox error, clearing cache:', error);
        clearDebugSandbox();
      }
    },
  });

  const refreshFilesMutation = useMutation<Record<string, string>>({
    mutationFn: async () => {
      const sandboxId = useSandboxStore.getState().sandboxId;
      if (!sandboxId) throw new Error("No sandbox ID available");
      const result = await trpc.sandbox.readFiles.mutate({ sandboxId });
      return result.files;
    },
    onSuccess: (newFiles) => setFiles(newFiles),
  });

  const reconnectMutation = useMutation<SandboxData, SandboxReconnectError, string>({
    mutationFn: async (sandboxId: string): Promise<SandboxData> => {
      try {
        return await trpc.sandbox.reconnect.mutate({ sandboxId });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to reconnect sandbox';
        const trpcCode = (error as { data?: { code?: string } })?.data?.code;
        if (trpcCode === 'PRECONDITION_FAILED' || msg === 'Sandbox expired') {
          throw new SandboxReconnectError(msg, 'sandbox_expired');
        }
        throw new SandboxReconnectError(msg, 'sandbox_reconnect_failed');
      }
    },
    onSuccess: (data) => setSandboxData({ sandboxId: data.sandboxId, url: data.url, files: data.files }),
  });

  const writeFileMutation = useMutation<{ filePath: string; content: string }, Error, WriteFileParams>({
    mutationFn: async ({ filePath, content }: WriteFileParams) => {
      const sandboxId = useSandboxStore.getState().sandboxId;
      if (!sandboxId) throw new Error("No sandbox ID available");
      return trpc.sandbox.writeFile.mutate({ sandboxId, filePath, content });
    },
    onSuccess: ({ filePath, content }) => updateFile(filePath, content),
  });

  const writeFilesMutation = useMutation<Record<string, string>, Error, WriteFilesParams>({
    mutationFn: async ({ files, deleteOthers }: WriteFilesParams) => {
      const sandboxId = useSandboxStore.getState().sandboxId;
      if (!sandboxId) throw new Error("No sandbox ID available");
      return trpc.sandbox.writeFiles.mutate({ sandboxId, files, deleteOthers });
    },
    onSuccess: (files) => {
      setFiles(files);
      bumpPreviewKey();
    },
  });

  const { mutateAsync: createSandboxAsync } = createMutation;
  const { mutateAsync: refreshFilesAsync } = refreshFilesMutation;
  const { mutateAsync: reconnectAsync } = reconnectMutation;
  const { mutateAsync: writeFileAsync } = writeFileMutation;
  const { mutateAsync: writeFilesAsync } = writeFilesMutation;

  const createSandbox = useCallback(
    (repositoryUrl?: string) => createSandboxAsync(repositoryUrl),
    [createSandboxAsync]
  );

  const writeFile = useCallback(
    (filePath: string, content: string) => writeFileAsync({ filePath, content }),
    [writeFileAsync]
  );

  const writeFiles = useCallback(
    (files: Record<string, string>, deleteOthers?: boolean) =>
      writeFilesAsync({ files, deleteOthers }),
    [writeFilesAsync]
  );

  const updateLocalFile = useCallback(
    (filePath: string, content: string) => updateFile(filePath, content),
    [updateFile]
  );

  const refreshFiles = useCallback(() => refreshFilesAsync(), [refreshFilesAsync]);

  const reconnectSandbox = useCallback(
    (sandboxId: string) => reconnectAsync(sandboxId),
    [reconnectAsync]
  );

  return {
    createSandbox,
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message ?? null,

    writeFile,
    isWriting: writeFileMutation.isPending,
    writeError: writeFileMutation.error?.message ?? null,

    writeFiles,
    isWritingFiles: writeFilesMutation.isPending,
    writeFilesError: writeFilesMutation.error?.message ?? null,

    updateLocalFile,
    refreshFiles,
    isRefreshing: refreshFilesMutation.isPending,

    reconnectSandbox,
    isReconnecting: reconnectMutation.isPending,
    reconnectError: reconnectMutation.error instanceof Error ? reconnectMutation.error.message : null,
    isSandboxExpired:
      reconnectMutation.error instanceof SandboxReconnectError &&
      reconnectMutation.error.code === "sandbox_expired",
  };
}
