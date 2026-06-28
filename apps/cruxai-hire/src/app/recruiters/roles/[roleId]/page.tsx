'use client';

import { Suspense, use, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RoleStatus, SubmissionStatus } from "@/types/recruiter";
import type { QuestionStatus, QuestionDifficulty } from "@/types/question-shared";
import { useInvitesQuery } from "@/hooks/api/invites";
import { useCandidatesQuery } from "@/hooks/api/candidates";
import { useSubmissionsQuery } from "@/hooks/api/submissions";
import { CandidatePipeline } from "@/components/recruiters/CandidatePipeline";
import { ArrowLeft, Bot, Clock, Edit, Eye, GitBranch, Plus, Send, UserPlus, X } from "lucide-react";
import { AttachQuestionsDialog } from "@/components/recruiters/AttachQuestionsDialog";
import { RoleForm } from "@/components/recruiters/RoleForm";
import { useRouter } from "next/navigation";
import { SendToCandidateDialog } from "@/components/recruiters/SendToCandidateDialog";
import { InviteCandidateDialog } from "@/components/recruiters/InviteCandidateDialog";
import { useRoleQuery, useUpdateRoleMutation, useSetRoleQuestionsMutation } from "@/hooks/api/roles";
import { useQuestionsQuery } from "@/hooks/api/questions";
import { useTabSearchParam } from "@/hooks/tabs/useTabSearchParam";
import { buildPipelineItems, computeInviteStatus } from "@/lib/invite-status";
import { CompactAnalysis } from "@/components/recruiters/CompactAnalysis";

const statusColors: Record<RoleStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-green-500/10 text-green-600 dark:text-green-400",
  paused: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  closed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const questionStatusColors: Record<QuestionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-500/10 text-green-600 dark:text-green-400",
  archived: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const questionDifficultyColors: Record<QuestionDifficulty, string> = {
  easy: "bg-green-500/10 text-green-600 dark:text-green-400",
  medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const submissionStatusColors: Record<SubmissionStatus, string> = {
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  submitted: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  analyzing: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  analysis_failed: "bg-red-500/10 text-red-600 dark:text-red-400",
  reviewed: "bg-green-500/10 text-green-600 dark:text-green-400",
};

const submissionStatusLabels: Record<SubmissionStatus, string> = {
  in_progress: "In Progress",
  submitted: "Submitted",
  analyzing: "Analyzing",
  analysis_failed: "Analysis Failed",
  reviewed: "Reviewed",
};

export default function RoleDetailPage({ params }: { params: Promise<{ roleId: string }> }) {
  return (
    <Suspense>
      <RoleDetailContent params={params} />
    </Suspense>
  );
}

function RoleDetailContent({ params }: { params: Promise<{ roleId: string }> }) {
  const router = useRouter();
  const { roleId } = use(params);
  const [activeTab, setActiveTab] = useTabSearchParam("overview");

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<{ id: string; title: string } | null>(null);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data: role, isLoading: roleLoading } = useRoleQuery(roleId);
  const { data: allQuestions = [] } = useQuestionsQuery();
  const updateRoleMutation = useUpdateRoleMutation();
  const setRoleQuestionsMutation = useSetRoleQuestionsMutation();

  const { data: invites = [] } = useInvitesQuery({ roleId });
  const { data: allCandidates = [] } = useCandidatesQuery();
  const { data: allSubmissions = [] } = useSubmissionsQuery();

  const questions = allQuestions.filter((q) => role?.questionIds?.includes(q.id));

  const roleSubmissions = allSubmissions
    .filter((s) => invites.some((i) => i.id === s.inviteId))
    .slice()
    .sort((a, b) => {
      const aTime = a.submittedAt ?? a.startedAt ?? null;
      const bTime = b.submittedAt ?? b.startedAt ?? null;
      if (aTime === bTime) return 0;
      if (aTime === null) return -1;
      if (bTime === null) return 1;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  const pipelineItems = buildPipelineItems(invites, allCandidates, allSubmissions, role ? [role] : []);

  const candidateCount = new Set(invites.map((i) => i.candidateId)).size;
  const submissionCount = roleSubmissions.length;
  const pendingReviews = roleSubmissions.filter((s) => s.status === 'submitted').length;

  const handleQuestionSelectionChange = async (ids: string[]) => {
    await setRoleQuestionsMutation.mutateAsync({ id: roleId, questionIds: ids });
  };

  const handleRoleFormSubmit = async (data: import("@/types/recruiter").RoleFormData, questionIds: string[]) => {
    await updateRoleMutation.mutateAsync({ id: roleId, data: { ...data, questionIds } });
    setIsEditingRole(false);
  };

  if (roleLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container py-8 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Role not found</p>
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
          <div className="mb-6">
            <Link href="/recruiters" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Roles
            </Link>
          </div>

          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{role.title}</h1>
                <Badge className={statusColors[role.status]} variant="secondary">
                  {role.status.charAt(0).toUpperCase() + role.status.slice(1)}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                Created {new Date(role.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isEditingRole ? (
                <Button variant="outline" onClick={() => setIsEditingRole(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setIsEditingRole(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Role
                </Button>
              )}
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Candidate
              </Button>
            </div>
          </div>

          {isEditingRole && (
            <div className="mb-8">
              <RoleForm
                initialData={role}
                onSubmit={handleRoleFormSubmit}
                allQuestions={allQuestions}
              />
            </div>
          )}

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{candidateCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissionCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReviews}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
              <TabsTrigger value="submissions">Submissions ({roleSubmissions.length})</TabsTrigger>
              <TabsTrigger value="candidates">Candidates ({pipelineItems.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {roleSubmissions.slice(0, 3).map((sub) => {
                      const invite = invites.find((i) => i.id === sub.inviteId);
                      return (
                        <div key={sub.id} className="flex items-center justify-between border-b py-3 last:border-0">
                          <div>
                            <p className="font-medium text-sm">{invite?.inviteCode ?? sub.inviteId}</p>
                            <p className="text-sm text-muted-foreground">
                              {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : "In progress"}
                            </p>
                          </div>
                          <Badge className={submissionStatusColors[sub.status]} variant="secondary">
                            {submissionStatusLabels[sub.status]}
                          </Badge>
                        </div>
                      );
                    })}
                    {roleSubmissions.length === 0 && <p className="text-muted-foreground">No submissions yet</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {questions
                      .filter((q) => q.status === "published")
                      .slice(0, 3)
                      .map((q) => (
                        <div key={q.id} className="flex items-center justify-between border-b py-3 last:border-0">
                          <div>
                            <p className="font-medium">{q.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {q.timeConstraints?.limit} {q.timeConstraints?.unit}
                            </p>
                          </div>
                          <Badge className={questionStatusColors[q.status]} variant="secondary">
                            {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    {questions.length === 0 && <p className="text-muted-foreground">No questions yet</p>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="questions" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">Attached Questions ({questions.length})</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Questions attached to this role. Send them to candidates or browse the library to attach more.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AttachQuestionsDialog
                      allQuestions={allQuestions}
                      selectedIds={role.questionIds || []}
                      onConfirm={handleQuestionSelectionChange}
                    />
                    <Button asChild>
                      <Link href={`/recruiters/questions/new?roleId=${role.id}`}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Question
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {questions.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        No questions attached yet. Click &quot;Attach Questions&quot; to pick from the library,
                        or &quot;New Question&quot; to create one.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((question) => {
                        const llmAllowed = (question.aiPermissions?.allowedModels?.length ?? 0) > 0;
                        const questionHref = `/recruiters/questions/${question.id}?roleId=${role.id}` as Route;
                        return (
                          <div key={question.id} className="rounded-lg border p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-2 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Link
                                    href={questionHref}
                                    className="text-sm font-semibold hover:underline"
                                  >
                                    {question.title}
                                  </Link>
                                  <Badge className={questionStatusColors[question.status]} variant="secondary">
                                    {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                                  </Badge>
                                  <Badge className={questionDifficultyColors[question.difficulty]} variant="secondary">
                                    {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">{question.description}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {question.timeConstraints?.limit} {question.timeConstraints?.unit}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <Bot className="h-3 w-3" />
                                    LLM {llmAllowed ? "Allowed" : "Not allowed"}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuestionSelectionChange((role.questionIds || []).filter((id) => id !== question.id))}
                                aria-label={`Remove ${question.title}`}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedQuestion({ id: question.id, title: question.title });
                                  setSendDialogOpen(true);
                                }}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Send to candidate
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={questionHref}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={questionHref}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invite Code</TableHead>
                        <TableHead>Question</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Analysis</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roleSubmissions.map((submission) => {
                        const invite = invites.find((i) => i.id === submission.inviteId);
                        const question = allQuestions.find((q) => q.id === invite?.questionId);
                        return (
                          <TableRow key={submission.id}>
                            <TableCell className="font-mono text-xs">{invite?.inviteCode ?? "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{question?.title ?? "Unknown question"}</TableCell>
                            <TableCell>
                              <Badge className={submissionStatusColors[submission.status]} variant="secondary">
                                {submissionStatusLabels[submission.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <CompactAnalysis analysisResult={submission.analysisResult ?? null} hireRecommendation={submission.hireRecommendation} />
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : "In progress"}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/recruiters/submissions/${submission.id}`}>
                                  <GitBranch className="mr-2 h-4 w-4" />
                                  Review
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {roleSubmissions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No submissions yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="candidates" className="mt-6">
              <CandidatePipeline
                items={pipelineItems}
                onItemClick={(item) => router.push(`/recruiters/candidates/${item.candidate.id}`)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {selectedQuestion && (
        <SendToCandidateDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          questionId={selectedQuestion.id}
          questionTitle={selectedQuestion.title}
          roleId={roleId}
        />
      )}

      <InviteCandidateDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
}
