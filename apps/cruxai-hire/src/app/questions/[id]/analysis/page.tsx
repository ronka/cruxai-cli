'use client';

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuestionQuery } from "@/hooks/api/questions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AnalysisView } from "@/components/analysis/AnalysisView";
import { AnalysisStats } from "@/components/analysis/AnalysisStats";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useAnalysisMutation } from "@/hooks/useAnalysis";
import { useHireRecommendationMutation } from "@/hooks/useHireRecommendation";
import { useQuestionSessionStore } from "@/stores/questionSessionStore";
import { useShallow } from "zustand/react/shallow";
import { useQuestionAnalysisNotFoundRedirect } from "@/hooks/question-analysis/useQuestionAnalysisNotFoundRedirect";
import { useTriggerQuestionAnalysis } from "@/hooks/question-analysis/useTriggerQuestionAnalysis";
import { useTriggerHireRecommendation } from "@/hooks/question-analysis/useTriggerHireRecommendation";
import { useSubmissionQuery } from "@/hooks/api/submissions";
import { deserializeSnapshots } from "@/lib/timeline/serialization";
import { difficultyTextColors } from "@/lib/question/difficulty-style";

export default function QuestionAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: question, isLoading: questionLoading } = useQuestionQuery(id);

  const submissionId = useQuestionSessionStore((state) => state.submissionId);
  const sessionData = useQuestionSessionStore(
    useShallow((state) => ({
      testSummary: state.testSummary,
    }))
  );

  const { data: submission, isLoading: submissionLoading } = useSubmissionQuery(submissionId ?? '');
  const submissionLoaded = !!submissionId && !submissionLoading;

  const analysisSessionData = {
    timeSpent: submission?.timeSpent ?? "00:00",
    messages: submission?.chatMessages ?? [],
    snapshots: deserializeSnapshots(submission?.snapshots ?? []),
  };

  const { mutate, data: analysis, isPending, error } = useAnalysisMutation();
  const { mutate: mutateHire, data: hireResult, isPending: hireIsPending } = useHireRecommendationMutation();

  useTriggerQuestionAnalysis({
    question,
    sessionData: analysisSessionData,
    debugMode: false,
    analysis,
    existingAnalysis: submission?.analysisResult,
    submissionLoaded,
    isPending,
    mutate,
    submissionId: submissionId ?? undefined,
  });

  useTriggerHireRecommendation({
    question,
    sessionData: analysisSessionData,
    existingRecommendation: hireResult?.recommendation ?? submission?.hireRecommendation,
    submissionLoaded,
    isPending: hireIsPending,
    mutate: mutateHire,
    submissionId: submissionId ?? undefined,
  });

  useQuestionAnalysisNotFoundRedirect(!questionLoading, question, router);

  if (questionLoading || !question) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const hireVerdict = hireResult?.recommendation ?? submission?.hireRecommendation;
  const resolvedInsights = analysis?.messageInsights ?? submission?.analysisResult?.messageInsights;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/questions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-sm font-medium">Analysis Results</h1>
            <p className="text-xs text-muted-foreground">Question #{question.id}</p>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{question.title}</h2>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {question.role}
                </Badge>
                <span className={`text-sm font-medium capitalize ${difficultyTextColors[question.difficulty]}`}>
                  {question.difficulty}
                </span>
              </div>
            </div>
            {isPending ? (
              <div className="text-center">
                <Skeleton className="h-10 w-32 mx-auto" />
                <div className="text-xs text-muted-foreground mt-1">Analyzing...</div>
              </div>
            ) : resolvedInsights?.length ? (
              <AnalysisStats insights={resolvedInsights} />
            ) : error ? (
              <div className="text-center text-destructive">
                <AlertCircle className="h-10 w-10 mx-auto" />
                <div className="text-xs mt-1">Error</div>
              </div>
            ) : null}
          </div>

          <AnalysisView
            submissionId={submissionId ?? ''}
            messages={analysisSessionData.messages}
            snapshots={analysisSessionData.snapshots}
            messageInsights={resolvedInsights}
            hireVerdict={hireVerdict}
            timeSpent={submission?.timeSpent ?? "00:00"}
            messageCount={submission?.messageCount ?? 0}
            tokensIn={submission?.tokensIn ?? 0}
            tokensOut={submission?.tokensOut ?? 0}
            testSummary={sessionData?.testSummary ?? null}
            isAnalysisPending={isPending}
            isHirePending={hireIsPending}
            analysisError={error}
            footer={
              <div className="flex justify-center gap-4 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/questions">Back to Questions</Link>
                </Button>
                <Button asChild>
                  <Link href={`/questions/${question.id}`}>Try Again</Link>
                </Button>
              </div>
            }
          />
        </div>
      </main>
    </div>
  );
}
