import { useMutation } from "@tanstack/react-query";
import { useTRPCClient } from "@/lib/trpc/trpc";
import { useSandboxStore } from "@/stores/sandboxStore";
import { useTestResultsStore } from "@/stores/testResultsStore";
import type { JestReport } from "@/types/test-results";

interface RunTestsResponse {
  success: boolean;
  results?: JestReport;
  error?: string;
  stdout?: string;
  stderr?: string;
  exitCode: number;
}

export function useTestRunner() {
  const trpc = useTRPCClient();
  const { setReport, setRunning, setError } = useTestResultsStore();

  const runTestsMutation = useMutation<RunTestsResponse>({
    mutationFn: async () => {
      const sandboxId = useSandboxStore.getState().sandboxId;
      if (!sandboxId) throw new Error("No sandbox ID available");
      return trpc.sandbox.runTests.mutate({ sandboxId });
    },
    onMutate: () => {
      setRunning(true);
      setError(null);
    },
    onSuccess: (data) => {
      if (data.success && data.results) {
        setReport(data.results);
      } else {
        setError(data.error || "Tests completed but results could not be parsed");
      }
      setRunning(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      setRunning(false);
    },
  });

  return {
    runTests: () => runTestsMutation.mutateAsync(),
    isRunning: runTestsMutation.isPending,
    error: runTestsMutation.error?.message ?? null,
  };
}
