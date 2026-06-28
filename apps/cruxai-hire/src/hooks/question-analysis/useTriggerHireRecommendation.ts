import { useEffect } from "react";
import type { UIMessage } from "ai";
import type { TimelineSnapshot } from "@/types/timeline";
import type { HireRecommendationInput } from "@/hooks/useHireRecommendation";
import type { HireRecommendation } from "@/types/analysis";
import { simplifyMessages, snapshotsToSystemMessages } from "@/lib/analysisUtils";

type HireRecommendationSessionData = {
  timeSpent: string;
  messages: UIMessage[];
  snapshots: TimelineSnapshot[];
};

type QuestionSummary = {
  id: string;
} | undefined;

type TriggerHireRecommendationParams = {
  question: QuestionSummary;
  sessionData: HireRecommendationSessionData;
  existingRecommendation: HireRecommendation | null | undefined;
  submissionLoaded: boolean;
  isPending: boolean;
  mutate: (payload: HireRecommendationInput) => void;
  submissionId?: string;
};

export function useTriggerHireRecommendation({
  question,
  sessionData,
  existingRecommendation,
  submissionLoaded,
  isPending,
  mutate,
  submissionId,
}: TriggerHireRecommendationParams) {
  useEffect(() => {
    if (question && submissionLoaded && sessionData.messages.length > 0 && existingRecommendation == null && !isPending) {
      mutate({
        messages: simplifyMessages(sessionData.messages),
        systemMessages: snapshotsToSystemMessages(sessionData.snapshots, sessionData.messages),
        questionId: question.id,
        timeSpent: sessionData.timeSpent,
        submissionId,
      });
    }
  }, [question, sessionData, existingRecommendation, submissionLoaded, isPending, mutate, submissionId]);
}
