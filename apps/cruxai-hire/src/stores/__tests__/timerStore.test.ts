import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTimerStore } from '@/stores/timerStore';

beforeEach(() => {
  vi.useFakeTimers();
  useTimerStore.setState({
    seconds: 0,
    isRunning: false,
    intervalId: null,
    limitSeconds: null,
    hardStop: false,
  });
});

afterEach(() => {
  useTimerStore.getState().reset();
  vi.useRealTimers();
});

describe('timerStore', () => {
  describe('initialize', () => {
    it('sets limitSeconds and hardStop, resets seconds', () => {
      useTimerStore.getState().initialize(3600, true);
      const s = useTimerStore.getState();
      expect(s.limitSeconds).toBe(3600);
      expect(s.hardStop).toBe(true);
      expect(s.seconds).toBe(0);
      expect(s.isRunning).toBe(false);
    });
  });

  describe('start / tick / countdown', () => {
    it('increments seconds on tick', () => {
      useTimerStore.getState().initialize(120, false);
      useTimerStore.getState().start();
      vi.advanceTimersByTime(3000);
      expect(useTimerStore.getState().seconds).toBe(3);
    });

    it('computes correct time remaining during countdown', () => {
      useTimerStore.getState().initialize(60, false);
      useTimerStore.getState().start();
      vi.advanceTimersByTime(10000);
      expect(useTimerStore.getState().getTimeRemaining()).toBe(50);
    });

    it('stops at limitSeconds boundary (isExpired)', () => {
      useTimerStore.getState().initialize(5, false);
      useTimerStore.getState().start();
      vi.advanceTimersByTime(5000);
      const s = useTimerStore.getState();
      expect(s.seconds).toBe(5);
      expect(s.isRunning).toBe(false);
      expect(s.isExpired()).toBe(true);
    });

    it('isExpired is false before the boundary', () => {
      useTimerStore.getState().initialize(5, false);
      useTimerStore.getState().start();
      vi.advanceTimersByTime(4000);
      expect(useTimerStore.getState().isExpired()).toBe(false);
    });

    it('isExpired is false when no limit is set', () => {
      useTimerStore.getState().start();
      vi.advanceTimersByTime(60000);
      expect(useTimerStore.getState().isExpired()).toBe(false);
    });
  });

  describe('hardStop flag', () => {
    it('is preserved after expiry', () => {
      useTimerStore.getState().initialize(3, true);
      useTimerStore.getState().start();
      vi.advanceTimersByTime(3000);
      expect(useTimerStore.getState().hardStop).toBe(true);
      expect(useTimerStore.getState().isExpired()).toBe(true);
    });
  });

  describe('start idempotency', () => {
    it('does not create a second interval when already running', () => {
      useTimerStore.getState().initialize(60, false);
      useTimerStore.getState().start();
      const firstIntervalId = useTimerStore.getState().intervalId;
      useTimerStore.getState().start();
      expect(useTimerStore.getState().intervalId).toBe(firstIntervalId);
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      useTimerStore.getState().initialize(60, true);
      useTimerStore.getState().start();
      vi.advanceTimersByTime(5000);
      useTimerStore.getState().reset();
      const s = useTimerStore.getState();
      expect(s.seconds).toBe(0);
      expect(s.isRunning).toBe(false);
      expect(s.intervalId).toBeNull();
      expect(s.limitSeconds).toBeNull();
      expect(s.hardStop).toBe(false);
    });

    it('stops the interval after reset', () => {
      useTimerStore.getState().initialize(60, false);
      useTimerStore.getState().start();
      useTimerStore.getState().reset();
      vi.advanceTimersByTime(5000);
      expect(useTimerStore.getState().seconds).toBe(0);
    });
  });

  describe('initializeWithElapsed', () => {
    it('resumes mid-session from saved offset', () => {
      useTimerStore.getState().initializeWithElapsed(30, 60, false);
      const s = useTimerStore.getState();
      expect(s.seconds).toBe(30);
      expect(s.isRunning).toBe(true);
      expect(s.limitSeconds).toBe(60);
    });

    it('ticks from the saved offset', () => {
      useTimerStore.getState().initializeWithElapsed(30, 60, false);
      vi.advanceTimersByTime(5000);
      expect(useTimerStore.getState().seconds).toBe(35);
    });

    it('does not start when already expired', () => {
      useTimerStore.getState().initializeWithElapsed(60, 60, false);
      const s = useTimerStore.getState();
      expect(s.isRunning).toBe(false);
      expect(s.isExpired()).toBe(true);
    });

    it('treats elapsed > limit as already expired', () => {
      useTimerStore.getState().initializeWithElapsed(70, 60, false);
      expect(useTimerStore.getState().isRunning).toBe(false);
      expect(useTimerStore.getState().isExpired()).toBe(true);
    });

    it('preserves hardStop from argument', () => {
      useTimerStore.getState().initializeWithElapsed(0, 60, true);
      expect(useTimerStore.getState().hardStop).toBe(true);
    });

    it('falls back to existing limitSeconds when not provided', () => {
      useTimerStore.setState({ limitSeconds: 90 });
      useTimerStore.getState().initializeWithElapsed(10);
      expect(useTimerStore.getState().limitSeconds).toBe(90);
    });
  });

  describe('getFormatted', () => {
    it('returns "00:00" when at limit (countdown exhausted)', () => {
      useTimerStore.getState().initialize(0, false);
      expect(useTimerStore.getState().getFormatted()).toBe('00:00');
    });

    it('returns "59:59" for 3599s remaining countdown', () => {
      useTimerStore.getState().initialize(3599, false);
      expect(useTimerStore.getState().getFormatted()).toBe('59:59');
    });

    it('returns hours format "01:00:00" for 3600s limit', () => {
      useTimerStore.getState().initialize(3600, false);
      expect(useTimerStore.getState().getFormatted()).toBe('01:00:00');
    });

    it('returns correct mid-countdown value', () => {
      useTimerStore.getState().initialize(120, false);
      useTimerStore.getState().start();
      vi.advanceTimersByTime(10000);
      expect(useTimerStore.getState().getFormatted()).toBe('01:50');
    });

    it('counts up without a limit', () => {
      useTimerStore.getState().start();
      vi.advanceTimersByTime(65000);
      expect(useTimerStore.getState().getFormatted()).toBe('01:05');
    });
  });

  describe('getTimeRemaining', () => {
    it('returns null when no limit is set', () => {
      expect(useTimerStore.getState().getTimeRemaining()).toBeNull();
    });

    it('returns 0 when expired (does not go negative)', () => {
      useTimerStore.getState().initialize(5, false);
      useTimerStore.getState().start();
      vi.advanceTimersByTime(10000);
      expect(useTimerStore.getState().getTimeRemaining()).toBe(0);
    });
  });
});
