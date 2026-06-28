'use client';

import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTestResultsStore } from "@/stores/testResultsStore";
import { useTestRunner } from "@/hooks/sandbox/useTestRunner";
import { useSandboxStore } from "@/stores/sandboxStore";
import { normalizeJestStatus } from "@/stores/testResultsStore";
import {
  TestResults,
  TestSuite,
  TestSuiteName,
  TestSuiteContent,
  Test,
  TestError,
  TestErrorMessage,
  TestErrorStack,
} from "@/components/ai-elements/test-results";

export function TestCasesPanel() {
  const sandboxId = useSandboxStore((state) => state.sandboxId);
  const { report, summary, error } = useTestResultsStore();
  const { runTests, isRunning } = useTestRunner();

  const handleRunTests = () => {
    if (!sandboxId || isRunning) return;
    runTests();
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header with Run button */}
      <div className="flex h-10 items-center justify-between border-b border-border bg-muted/30 px-4">
        <span className="text-xs font-medium text-foreground">Test Results</span>
        <Button
          size="sm"
          onClick={handleRunTests}
          disabled={!sandboxId || isRunning}
          variant={sandboxId && !isRunning ? "default" : "secondary"}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              Run Tests
            </>
          )}
        </Button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4">
        {/* Loading state */}
        {isRunning && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">Running Jest tests...</p>
          </div>
        )}

        {/* Error state */}
        {error && !isRunning && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">Failed to run tests</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </div>
        )}

        {/* Empty state - no tests run yet */}
        {!isRunning && !error && !report && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Play className="h-8 w-8 mb-3 opacity-50" />
            <p className="text-sm">No test results yet</p>
            <p className="text-xs mt-1">Click &quot;Run Tests&quot; to execute Jest tests</p>
          </div>
        )}

        {/* Results display */}
        {!isRunning && !error && report && (
          <TestResults summary={summary ?? undefined}>
            {report.testResults.map((testResult) => {
              const suiteStatus = normalizeJestStatus(testResult.status);

              return (
                <TestSuite
                  key={testResult.name}
                  name={testResult.name}
                  status={suiteStatus}
                  defaultOpen={testResult.status === "failed"}
                >
                  <TestSuiteName />
                  <TestSuiteContent>
                    {testResult.assertionResults.map((assertion, i) => {
                      const status = normalizeJestStatus(assertion.status);
                      const hasError =
                        status === "failed" && assertion.failureMessages?.length > 0;
                      const errorMessage = hasError
                        ? assertion.failureMessages[0].split("\n")[0]
                        : undefined;
                      const errorStack = hasError
                        ? assertion.failureMessages[0]
                            .match(/\n\s+at .*/g)
                            ?.join("\n")
                        : undefined;

                      return (
                        <div key={`${testResult.name}-${i}`}>
                          <Test
                            name={assertion.title}
                            status={status}
                            duration={assertion.duration ?? undefined}
                          />
                          {hasError && (
                            <TestError>
                              {errorMessage && (
                                <TestErrorMessage>{errorMessage}</TestErrorMessage>
                              )}
                              {errorStack && (
                                <TestErrorStack>
                                  {errorStack.slice(0, 500)}
                                </TestErrorStack>
                              )}
                            </TestError>
                          )}
                        </div>
                      );
                    })}
                  </TestSuiteContent>
                </TestSuite>
              );
            })}
          </TestResults>
        )}
      </div>
    </div>
  );
}
