import { create } from 'zustand';

interface SandboxState {
  // State
  sandboxId: string | null;
  sandboxUrl: string | null;
  files: Record<string, string>;
  previewKey: number;

  // Actions
  setSandboxData: (data: { sandboxId: string; url: string; files: Record<string, string> }) => void;
  updateFile: (filePath: string, content: string) => void;
  setFiles: (files: Record<string, string>) => void;
  bumpPreviewKey: () => void;
  reset: () => void;
}

export const useSandboxStore = create<SandboxState>((set) => ({
  // Initial state
  sandboxId: null,
  sandboxUrl: null,
  files: {},
  previewKey: 0,

  // Actions
  setSandboxData: (data) =>
    set({
      sandboxId: data.sandboxId,
      sandboxUrl: data.url,
      files: data.files,
    }),

  updateFile: (filePath, content) =>
    set((state) => ({
      files: { ...state.files, [filePath]: content },
    })),

  setFiles: (files) => set({ files }),

  bumpPreviewKey: () =>
    set((state) => ({
      previewKey: state.previewKey + 1,
    })),

  reset: () =>
    set({
      sandboxId: null,
      sandboxUrl: null,
      files: {},
      previewKey: 0,
    }),
}));
