import { create } from 'zustand';

interface TimerState {
  // State
  seconds: number;
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  limitSeconds: number | null;
  hardStop: boolean;

  // Actions
  initialize: (limitSeconds: number, hardStop: boolean) => void;
  initializeWithElapsed: (
    elapsedSeconds: number,
    limitSeconds?: number | null,
    hardStop?: boolean
  ) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  getFormatted: () => string;
  getTimeRemaining: () => number | null;
  isExpired: () => boolean;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  // Initial state
  seconds: 0,
  isRunning: false,
  intervalId: null,
  limitSeconds: null,
  hardStop: false,

  // Actions
  initialize: (limitSeconds, hardStop) => {
    const state = get();
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }
    set({ seconds: 0, isRunning: false, intervalId: null, limitSeconds, hardStop });
  },

  initializeWithElapsed: (elapsedSeconds, limitSeconds, hardStop) => {
    const state = get();
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    const nextLimitSeconds = limitSeconds ?? state.limitSeconds;
    const nextHardStop = hardStop ?? state.hardStop;
    const hasExpired = nextLimitSeconds !== null && elapsedSeconds >= nextLimitSeconds;

    if (hasExpired) {
      set({
        seconds: elapsedSeconds,
        isRunning: false,
        intervalId: null,
        limitSeconds: nextLimitSeconds,
        hardStop: nextHardStop,
      });
      return;
    }

    const intervalId = setInterval(() => {
      get().tick();
    }, 1000);

    set({
      seconds: elapsedSeconds,
      isRunning: true,
      intervalId,
      limitSeconds: nextLimitSeconds,
      hardStop: nextHardStop,
    });
  },

  start: () => {
    const state = get();
    if (state.isRunning) return;

    const intervalId = setInterval(() => {
      get().tick();
    }, 1000);

    set({ isRunning: true, intervalId });
  },

  pause: () => {
    const state = get();
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }
    set({ isRunning: false, intervalId: null });
  },

  reset: () => {
    const state = get();
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }
    set({ seconds: 0, isRunning: false, intervalId: null, limitSeconds: null, hardStop: false });
  },

  tick: () => {
    const state = get();
    const newSeconds = state.seconds + 1;
    set({ seconds: newSeconds });

    // Auto-pause when countdown expires
    if (state.limitSeconds !== null && newSeconds >= state.limitSeconds) {
      const { intervalId } = get();
      if (intervalId) clearInterval(intervalId);
      set({ isRunning: false, intervalId: null });
    }
  },

  getTimeRemaining: () => {
    const { seconds, limitSeconds } = get();
    if (limitSeconds === null) return null;
    return Math.max(0, limitSeconds - seconds);
  },

  isExpired: () => {
    const { seconds, limitSeconds } = get();
    if (limitSeconds === null) return false;
    return seconds >= limitSeconds;
  },

  getFormatted: () => {
    const state = get();
    const displaySeconds = state.limitSeconds !== null
      ? Math.max(0, state.limitSeconds - state.seconds)
      : state.seconds;

    const hours = Math.floor(displaySeconds / 3600);
    const minutes = Math.floor((displaySeconds % 3600) / 60);
    const secs = displaySeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
}));
