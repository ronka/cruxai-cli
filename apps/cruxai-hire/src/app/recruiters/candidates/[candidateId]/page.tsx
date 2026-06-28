'use client';

import { Suspense, use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CandidateStatus } from "@/types/recruiter";
import { CompactAnalysis } from "@/components/recruiters/CompactAnalysis";
import { useCandidateQuery } from "@/hooks/api/candidates";
import { useInvitesQuery } from "@/hooks/api/invites";
import { useSubmissionsQuery } from "@/hooks/api/submissions";
import { useRolesQuery } from "@/hooks/api/roles";
import { useQuestionsQuery } from "@/hooks/api/questions";
import { computeInviteStatus } from "@/lib/invite-status";
import { ArrowLeft, Calendar, ClipboardList, FileText, GitBranch, Mail, StickyNote } from "lucide-react";

const candidateStatusConfig: Record<CandidateStatus, { label: string; className: string }> = {
  invited: { label: "Invited", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  started: { label: "In Progress", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  submitted: { label: "Submitted", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  reviewed: { label: "Reviewed", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
};

export default function CandidateDetailPage({ params }: { params: Promise<{ candidateId: string }> }) {
  return (
    <Suspense>
      <CandidateDetailContent params={params} />
    </Suspense>
  );
}

function CandidateDetailContent({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = use(params);

  const { data: candidate, isLoading: candidateLoading } = useCandidateQuery(candidateId);
  const { data: invites = [] } = useInvitesQuery({ candidateId });
  const { data: allSubmissions = [] } = useSubmissionsQuery();
  const { data: roles = [] } = useRolesQuery();
  const { data: allQuestions = [] } = useQuestionsQuery();

  const submissionByInvite = new Map(allSubmissions.filter((s) => s.inviteId).map((s) => [s.inviteId!, s]));
  const roleMap = new Map(roles.map((r) => [r.id, r]));
  const questionMap = new Map(allQuestions.map((q) => [q.id, q]));

  if (candidateLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Candidate not found</p>
      </div>
    );
  }

  // Compute overall status as the "max" across all invites
  const statuses: CandidateStatus[] = ['invited', 'started', 'submitted', 'reviewed'];
  const allStatuses = invites.map((invite) => computeInviteStatus(submissionByInvite.get(invite.id)));
  const overallStatus: CandidateStatus = allStatuses.length > 0
    ? allStatuses.reduce((best, s) => statuses.indexOf(s) > statuses.indexOf(best) ? s : best, 'invited' as CandidateStatus)
    : 'invited';

  const statusConfig = candidateStatusConfig[overallStatus];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/recruiters">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-sm font-medium">{candidate.name}</h1>
            <p className="text-xs text-muted-foreground">{candidate.email}</p>
          </div>
          <Badge className={statusConfig.className} variant="secondary">
            {statusConfig.label}
          </Badge>
        </div>
      </header>

      <main className="container py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">{candidate.name}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{candidate.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Added {new Date(candidate.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-lg font-medium">{invites.length}</div>
                  <div className="text-xs text-muted-foreground">Invites</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-lg font-medium">{allSubmissions.filter((s) => invites.some((i) => i.id === s.inviteId)).length}</div>
                  <div className="text-xs text-muted-foreground">Submissions</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Badge className={statusConfig.className} variant="secondary">
                  {statusConfig.label}
                </Badge>
                <div>
                  <div className="text-xs text-muted-foreground">Overall Status</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {candidate.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <StickyNote className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{candidate.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invites & Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {invites.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Analysis</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invites.map((invite) => {
                      const submission = submissionByInvite.get(invite.id);
                      const role = roleMap.get(invite.roleId);
                      const question = questionMap.get(invite.questionId);
                      const status = computeInviteStatus(submission);
                      const config = candidateStatusConfig[status];
                      return (
                        <TableRow key={invite.id}>
                          <TableCell className="font-medium">{role?.title ?? "Unknown role"}</TableCell>
                          <TableCell className="text-muted-foreground">{question?.title ?? "Unknown question"}</TableCell>
                          <TableCell>
                            <Badge className={config.className} variant="secondary">
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <CompactAnalysis analysisResult={submission?.analysisResult} hireRecommendation={submission?.hireRecommendation} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {submission?.submittedAt
                              ? new Date(submission.submittedAt).toLocaleDateString()
                              : submission
                              ? "In progress"
                              : "Not started"}
                          </TableCell>
                          <TableCell>
                            {submission && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/recruiters/submissions/${submission.id}`}>
                                  <GitBranch className="mr-2 h-4 w-4" />
                                  Review
                                </Link>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No invites yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
