// Jest JSON Reporter Output Types

export type TestResultStatus = 'passed' | 'failed' | 'skipped';

export interface TestError {
  message: string;
  stack?: string;
}

// Jest assertion result (individual test)
export interface JestAssertionResult {
  ancestorTitles: string[];
  duration: number | null;
  // Serialized Error objects from Jest — shape varies by matcher/runner
  failureDetails: Array<{ message?: string; stack?: string; matcherResult?: { message: string; pass: boolean } }>;
  failureMessages: string[];
  fullName: string;
  invocations: number;
  location: { column: number; line: number } | null;
  numPassingAsserts: number;
  retryReasons: string[];
  startAt: number;
  status: 'passed' | 'failed' | 'pending' | 'disabled' | 'todo' | 'focused';
  title: string;
}

// Jest test suite result (file)
export interface JestTestResult {
  assertionResults: JestAssertionResult[];
  endTime: number;
  message: string;
  name: string; // file path
  startTime: number;
  status: 'passed' | 'failed' | 'pending' | 'focused';
  summary: string;
}

// Jest full report output
export interface JestReport {
  numFailedTestSuites: number;
  numFailedTests: number;
  numPassedTestSuites: number;
  numPassedTests: number;
  numPendingTestSuites: number;
  numPendingTests: number;
  numRuntimeErrorTestSuites: number;
  numTodoTests: number;
  numTotalTestSuites: number;
  numTotalTests: number;
  startTime: number;
  success: boolean;
  testResults: JestTestResult[];
  wasInterrupted: boolean;
}

// Minimal summary persisted to submissions.test_summary
export interface TestSummary {
  passed: number;
  total: number;
}

// Simplified interface for UI consumption
export interface TestResultSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

