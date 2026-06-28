import { useEffect } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { Question } from "@/types/question-shared";

export function useQuestionAnalysisNotFoundRedirect(
  hasHydrated: boolean,
  question: Question | null | undefined,
  router: AppRouterInstance,
) {
  useEffect(() => {
    if (hasHydrated && !question) {
      router.replace("/questions");
    }
  }, [hasHydrated, question, router]);
}
