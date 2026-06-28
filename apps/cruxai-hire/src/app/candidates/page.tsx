'use client';

import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CandidateDashboardStats } from '@/components/candidates/CandidateDashboardStats';
import { AssessmentsList } from '@/components/candidates/AssessmentsList';
import { useSubmissionsQuery } from '@/hooks/api/submissions';
import { useInvitesQuery } from '@/hooks/api/invites';
import { useQuestionsQuery } from '@/hooks/api/questions';
import { useRolesQuery } from '@/hooks/api/roles';
import { useTabSearchParam } from '@/hooks/tabs/useTabSearchParam';
import type { CandidateAssessment } from '@/types/candidate';
import type { Submission, Invite } from '@/types/recruiter';
import type { Question } from '@/types/question-shared';
import type { JobRole } from '@/types/recruiter';

export default function CandidatesPage() {
  return (
    <Suspense>
      <CandidatesContent />
    </Suspense>
  );
}

function toAssessment(
  sub: Submission,
  invite: Invite | undefined,
  question: Question | undefined,
  role: JobRole | undefined
): CandidateAssessment {
  return {
    id: sub.id,
    questionId: invite?.questionId ?? '',
    questionTitle: question?.title ?? 'Unknown Question',
    roleId: invite?.roleId ?? '',
    roleTitle: role?.title ?? 'Unknown Role',
    companyName: role?.title ?? '',
    status: sub.status as CandidateAssessment['status'],
    assignedAt: invite?.createdAt ?? new Date().toISOString(),
    startedAt: sub.startedAt ?? undefined,
    submittedAt: sub.submittedAt ?? undefined,
    timeLimit: question?.timeConstraints
      ? { value: question.timeConstraints.limit, unit: question.timeConstraints.unit }
      : { value: 60, unit: 'minutes' },
    hasAnalysis: sub.analysisResult != null,
  };
}

function CandidatesContent() {
  const [activeTab, setActiveTab] = useTabSearchParam("active");
  const { data: submissions = [], isLoading } = useSubmissionsQuery();
  const { data: invites = [] } = useInvitesQuery();
  const { data: questions = [] } = useQuestionsQuery();
  const { data: roles = [] } = useRolesQuery();

  const questionsById = Object.fromEntries(questions.map((q) => [q.id, q]));
  const rolesById = Object.fromEntries(roles.map((r) => [r.id, r]));
  const invitesById = Object.fromEntries(invites.map((i) => [i.id, i]));

  const assessments = submissions.map((sub) => {
    const invite = sub.inviteId ? invitesById[sub.inviteId] : undefined;
    return toAssessment(sub, invite, questionsById[invite?.questionId ?? ''], rolesById[invite?.roleId ?? '']);
  });

  const activeAssessments = assessments.filter((a) => a.status === 'in_progress');
  const completedAssessments = assessments.filter((a) => a.status === 'submitted' || a.status === 'reviewed');

  const inProgressCount = assessments.filter((a) => a.status === 'in_progress').length;
  const completedCount = completedAssessments.length;
  const analyzedCount = assessments.filter((a) => a.hasAnalysis).length;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container py-8">
            <div className="mb-8">
              <div className="h-9 w-48 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-5 w-64 animate-pulse rounded bg-muted" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">My Assessments</h1>
            <p className="mt-1 text-muted-foreground">
              Track your progress and complete assigned assessments
            </p>
          </div>

          <div className="mb-8">
            <CandidateDashboardStats
              assignedCount={assessments.length}
              inProgressCount={inProgressCount}
              completedCount={completedCount}
              analyzedCount={analyzedCount}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <AssessmentsList
                assessments={activeAssessments}
                emptyMessage="No active assessments."
              />
            </TabsContent>

            <TabsContent value="completed">
              <AssessmentsList
                assessments={completedAssessments}
                emptyMessage="No completed assessments yet."
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
