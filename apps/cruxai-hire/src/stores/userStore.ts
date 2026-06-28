import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MockUser } from '@/types/candidate';

interface UserState {
  // State
  user: MockUser | null;
  _hasHydrated: boolean;

  // Hydration
  setHasHydrated: (state: boolean) => void;

  // Actions
  setUser: (user: MockUser) => void;
  clearUser: () => void;

  // Reset
  reset: () => void;
}

const INITIAL_STATE = {
  user: null,
  _hasHydrated: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      // Hydration
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      // Actions
      setUser: (user) => set({ user }),

      clearUser: () => set({ user: null }),

      // Reset
      reset: () => set(INITIAL_STATE),
    }),
    {
      name: 'cruxai-user',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Standalone helper for initializing from mock data
export function initializeUser(user: MockUser) {
  const store = useUserStore.getState();
  if (!store.user) {
    store.setUser(user);
  }
}
