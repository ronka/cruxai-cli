'use client';

import { Suspense, use, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnalysisView } from "@/components/analysis/AnalysisView";
import { AnalysisStats } from "@/components/analysis/AnalysisStats";
import { SubmissionStatusSelect } from "@/components/recruiters/SubmissionStatusSelect";
import { useSubmissionQuery } from "@/hooks/api/submissions";
import { useInviteQuery } from "@/hooks/api/invites";
import { useQuestionQuery } from "@/hooks/api/questions";
import { useRoleQuery } from "@/hooks/api/roles";
import { useAnalysisMutation } from "@/hooks/useAnalysis";
import { useHireRecommendationMutation } from "@/hooks/useHireRecommendation";
import { simplifyMessages } from "@/lib/analysisUtils";
import { deserializeSnapshots } from "@/lib/timeline/serialization";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import type { TimelineSnapshot } from "@/types/timeline";
import type { MessageInsight } from "@/server/analysisSchema";
import type { HireRecommendation } from "@/types/analysis";

export default function SubmissionDetailPage({ params }: { params: Promise<{ submissionId: string }> }) {
  return (
    <Suspense>
      <SubmissionDetailContent params={params} />
    </Suspense>
  );
}

function SubmissionDetailContent({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = use(params);

  const { data: submission, isLoading } = useSubmissionQuery(submissionId);
  const { data: invite } = useInviteQuery(submission?.inviteId ?? '');
  const { data: question } = useQuestionQuery(invite?.questionId ?? '');
  const { data: role } = useRoleQuery(invite?.roleId ?? '');
  const { mutate: reanalyze, isPending: isReanalyzing, data: reanalysisResult } = useAnalysisMutation();
  const { mutate: reanalyzeHire, isPending: isReanalyzingHire } = useHireRecommendationMutation();
  const [reanalysisInsights, setReanalysisInsights] = useState<MessageInsight[] | null>(null);
  const [reanalysisVerdict, setReanalysisVerdict] = useState<HireRecommendation | null>(null);

  const snapshots = useMemo<TimelineSnapshot[]>(
    () => deserializeSnapshots(submission?.snapshots ?? []),
    [submission?.snapshots],
  );

  const messages = submission?.chatMessages ?? [];
  const storedInsights = submission?.analysisResult?.messageInsights ?? [];
  const messageInsights = reanalysisInsights ?? storedInsights;

  const handleReanalyze = () => {
    if (!question || !submission) return;
    const payload = {
      messages: simplifyMessages(messages),
      questionId: question.id,
      submissionId: submission.id,
      timeSpent: submission.timeSpent ?? "00:00",
    };
    reanalyze(payload, {
      onSuccess: (result) => {
        setReanalysisInsights(result.messageInsights ?? []);
      },
    });
    reanalyzeHire(payload, {
      onSuccess: (result) => {
        setReanalysisVerdict(result.recommendation);
      },
    });
  };
  void reanalysisResult;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Submission not found</p>
      </div>
    );
  }

  const hasAnalysis = submission.analysisResult != null || reanalysisInsights != null;
  const canReanalyze = messages.length > 0 && question != null;
  const isAnyReanalyzing = isReanalyzing || isReanalyzingHire;
  const hireVerdict = reanalysisVerdict ?? submission.hireRecommendation;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href={role ? `/recruiters/roles/${role.id}` : "/recruiters"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-sm font-medium">Submission Analysis</h1>
            <p className="text-xs text-muted-foreground">
              {invite?.inviteCode} • {question?.title ?? ""}
            </p>
          </div>
          {canReanalyze && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReanalyze}
              disabled={isAnyReanalyzing}
              className="gap-2"
            >
              {isAnyReanalyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {isAnyReanalyzing ? "Analyzing..." : "Re-analyze"}
            </Button>
          )}
          <SubmissionStatusSelect submissionId={submission.id} currentStatus={submission.status} />
        </div>
      </header>

      <main className="container py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{question?.title ?? ""}</h2>
              {role && (
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{role.title}</span>
                </div>
              )}
            </div>
            {isAnyReanalyzing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Re-analyzing...</span>
              </div>
            ) : hasAnalysis ? (
              <AnalysisStats insights={messageInsights} />
            ) : submission.status === 'submitted' || submission.status === 'reviewed' ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analysis pending</span>
              </div>
            ) : null}
          </div>

          <AnalysisView
            submissionId={submission.id}
            messages={messages}
            snapshots={snapshots}
            messageInsights={messageInsights.length > 0 ? messageInsights : undefined}
            hireVerdict={hireVerdict}
            timeSpent={submission.timeSpent ?? "—"}
            messageCount={submission.messageCount ?? 0}
            tokensIn={submission.tokensIn ?? 0}
            tokensOut={submission.tokensOut ?? 0}
            testSummary={submission.testSummary}
            isHirePending={isReanalyzingHire}
          />
        </div>
      </main>
    </div>
  );
}
