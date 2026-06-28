import { useEffect } from "react";
import type { UIMessage } from "ai";
import type { TimelineSnapshot } from "@/types/timeline";
import type { AnalysisApiResponse } from "@/server/analysisSchema";
import type { AnalysisInput } from "@/hooks/useAnalysis";
import type { AnalysisResult } from "@/types/analysis";
import { simplifyMessages, snapshotsToSystemMessages } from "@/lib/analysisUtils";

type AnalysisSessionData = {
  timeSpent: string;
  messages: UIMessage[];
  snapshots: TimelineSnapshot[];
};

type QuestionSummary = {
  id: string;
} | undefined;

type TriggerAnalysisParams = {
  question: QuestionSummary;
  sessionData: AnalysisSessionData;
  debugMode: boolean;
  analysis: AnalysisApiResponse | undefined;
  existingAnalysis?: AnalysisResult | null;
  submissionLoaded: boolean;
  isPending: boolean;
  mutate: (payload: AnalysisInput) => void;
  submissionId?: string;
};

export function useTriggerQuestionAnalysis({
  question,
  sessionData,
  debugMode,
  analysis,
  existingAnalysis,
  submissionLoaded,
  isPending,
  mutate,
  submissionId,
}: TriggerAnalysisParams) {
  useEffect(() => {
    if (debugMode) {
      console.log("[DEBUG MODE] Using mock analysis data, skipping API call");
      return;
    }

    if (question && submissionLoaded && sessionData.messages.length > 0 && !analysis && !existingAnalysis && !isPending) {
      mutate({
        messages: simplifyMessages(sessionData.messages),
        systemMessages: snapshotsToSystemMessages(sessionData.snapshots, sessionData.messages),
        questionId: question.id,
        timeSpent: sessionData.timeSpent,
        submissionId,
      });
    }
  }, [question, debugMode, sessionData, analysis, existingAnalysis, submissionLoaded, isPending, mutate, submissionId]);
}
