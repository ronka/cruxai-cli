'use client';

import { useState, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatTimeline } from "@/components/analysis/ChatTimeline";
import { AnalysisTLDR } from "@/components/analysis/AnalysisTLDR";
import { HireVerdictBadge } from "@/components/analysis/HireVerdictBadge";
import { CheckCircle2, Clock, Loader2, MessageSquare, Zap, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StoredMessage } from "@/types/stored-message";
import type { TimelineSnapshot } from "@/types/timeline";
import type { MessageInsight } from "@/server/analysisSchema";
import type { HireRecommendation } from "@/types/analysis";
import type { TestSummary } from "@/types/test-results";
import { RuleFindingsPanel } from "../rule-findings/RuleFindingsPanel";

interface AnalysisViewProps {
  submissionId: string;
  messages: StoredMessage[];
  snapshots: TimelineSnapshot[];
  messageInsights?: MessageInsight[];
  hireVerdict?: HireRecommendation | null;
  timeSpent?: string;
  messageCount?: number;
  tokensIn?: number;
  tokensOut?: number;
  testSummary?: TestSummary | null;
  isAnalysisPending?: boolean;
  isHirePending?: boolean;
  analysisError?: { message?: string } | null;
  footer?: React.ReactNode;
}

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value?: ReactNode;
  mono?: boolean;
  children?: ReactNode;
}

function StatCard({ icon: Icon, label, value, mono, children }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        <div className={Icon ? undefined : "w-full"}>
          {children ?? (
            <div className={`text-lg font-medium${mono ? " font-mono" : ""}`}>{value}</div>
          )}
          <div className={`text-xs text-muted-foreground${children ? " mt-1" : ""}`}>{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisErrorCard({ message }: { message?: string }) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex items-center gap-4 p-4">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <div>
          <div className="font-medium text-destructive">Analysis Failed</div>
          <p className="text-sm text-muted-foreground">
            {message ?? "Failed to generate analysis. Please try again."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisPendingCard() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <div className="text-sm text-muted-foreground">Analyzing your session...</div>
      </CardContent>
    </Card>
  );
}

export function AnalysisView({
  submissionId,
  messages,
  snapshots,
  messageInsights,
  hireVerdict,
  timeSpent = "00:00",
  messageCount = 0,
  tokensIn = 0,
  tokensOut = 0,
  testSummary,
  isAnalysisPending,
  isHirePending,
  analysisError,
  footer,
}: AnalysisViewProps) {
  const [timelineIndex, setTimelineIndex] = useState(0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Clock} label="Time Spent" value={timeSpent} mono />
        <StatCard icon={MessageSquare} label="Messages" value={messageCount} />
        <StatCard icon={Zap} label="Tokens In" value={tokensIn.toLocaleString()} mono />
        <StatCard icon={Zap} label="Tokens Out" value={tokensOut.toLocaleString()} mono />
        <StatCard
          icon={CheckCircle2}
          label="Tests"
          value={testSummary ? `${testSummary.passed} / ${testSummary.total}` : "—"}
          mono
        />
        <StatCard label="Verdict">
          {isHirePending ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <HireVerdictBadge recommendation={hireVerdict} />
          )}
        </StatCard>
      </div>

      <RuleFindingsPanel submissionId={submissionId} />

      {messageInsights && (
        <AnalysisTLDR
          messages={messages}
          messageInsights={messageInsights}
          onJumpToMessage={setTimelineIndex}
        />
      )}

      <ChatTimeline
        messages={messages}
        snapshots={snapshots}
        messageInsights={messageInsights}
        currentIndex={timelineIndex}
        onCurrentIndexChange={setTimelineIndex}
      />

      {analysisError && <AnalysisErrorCard message={analysisError.message} />}
      {isAnalysisPending && <AnalysisPendingCard />}

      {footer}
    </div>
  );
}
