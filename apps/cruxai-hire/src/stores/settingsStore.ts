import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Settings {
  // TODO: REMOVE IN PRODUCTION - Debug mode for development only
  debugMode: boolean;
  debugSandbox: {
    sandboxId: string | null;
    url: string | null;
    files: Record<string, string>;
  } | null;
}

interface SettingsState extends Settings {
  // TODO: REMOVE IN PRODUCTION - Debug mode actions
  toggleDebugMode: () => void;
  setDebugSandbox: (sandbox: { sandboxId: string; url: string; files: Record<string, string> }) => void;
  clearDebugSandbox: () => void;
  hasDebugSandbox: () => boolean;
}

const DEFAULT_SETTINGS: Settings = {
  // TODO: REMOVE IN PRODUCTION - Debug mode disabled by default
  debugMode: false,
  debugSandbox: null,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      // TODO: REMOVE IN PRODUCTION - Debug mode actions
      toggleDebugMode: () =>
        set((state) => {
          const newDebugMode = !state.debugMode;
          // If turning off debug mode, clear the cached sandbox
          if (!newDebugMode) {
            return { debugMode: newDebugMode, debugSandbox: null };
          }
          return { debugMode: newDebugMode };
        }),

      setDebugSandbox: (sandbox) =>
        set({ debugSandbox: sandbox }),

      clearDebugSandbox: () =>
        set({ debugSandbox: null }),

      hasDebugSandbox: () => {
        const state = get();
        return state.debugSandbox !== null && state.debugSandbox.sandboxId !== null;
      },
    }),
    {
      name: 'cruxai-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

