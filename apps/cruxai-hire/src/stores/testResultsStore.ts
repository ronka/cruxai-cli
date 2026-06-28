import { create } from 'zustand';
import type {
  JestReport,
  TestResultSummary,
  TestResultStatus,
} from '@/types/test-results';

interface TestResultsState {
  // State
  report: JestReport | null;
  summary: TestResultSummary | null;
  isRunning: boolean;
  error: string | null;
  lastRunAt: Date | null;

  // Actions
  setReport: (report: JestReport) => void;
  setRunning: (running: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

function normalizeJestStatus(jestStatus: string): TestResultStatus {
  switch (jestStatus) {
    case 'passed':
      return 'passed';
    case 'failed':
      return 'failed';
    case 'pending':
    case 'todo':
    case 'disabled':
      return 'skipped';
    default:
      return 'skipped';
  }
}

export { normalizeJestStatus };

function calculateSummary(report: JestReport): TestResultSummary {
  const duration = report.testResults.reduce(
    (sum, result) => sum + (result.endTime - result.startTime),
    0
  );

  return {
    total: report.numTotalTests,
    passed: report.numPassedTests,
    failed: report.numFailedTests,
    skipped: report.numPendingTests + report.numTodoTests,
    duration,
  };
}

export const useTestResultsStore = create<TestResultsState>((set) => ({
  // Initial state
  report: null,
  summary: null,
  isRunning: false,
  error: null,
  lastRunAt: null,

  // Actions
  setReport: (report) => {
    const summary = calculateSummary(report);
    set({
      report,
      summary,
      error: null,
      lastRunAt: new Date(),
    });
  },

  setRunning: (running) => set({ isRunning: running }),

  setError: (error) => set({ error, isRunning: false }),

  reset: () =>
    set({
      report: null,
      summary: null,
      isRunning: false,
      error: null,
      lastRunAt: null,
    }),
}));
