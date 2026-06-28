'use client';

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRolesQuery } from "@/hooks/api/roles";
import type { QuestionStatus, QuestionDifficulty, QuestionRole } from "@/types/question-shared";
import { ArrowLeft, Clock, Edit, FileText, Plus, Search, Eye, Link as LinkIcon, Send } from "lucide-react";
import { useQuestionsQuery } from "@/hooks/api/questions";
import { SendToCandidateDialog } from "@/components/recruiters/SendToCandidateDialog";

const statusColors: Record<QuestionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-500/10 text-green-600 dark:text-green-400",
  archived: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const difficultyColors: Record<QuestionDifficulty, string> = {
  easy: "bg-green-500/10 text-green-600 dark:text-green-400",
  medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function QuestionsLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Send to candidate dialog state
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<{ id: string; title: string } | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const { data: questions = [], isLoading } = useQuestionsQuery({ ownedOnly: true });
  const { data: roles = [] } = useRolesQuery();

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    const matchesDifficulty = difficultyFilter === "all" || q.difficulty === difficultyFilter;
    const matchesRole = roleFilter === "all" || q.role === roleFilter;
    return matchesSearch && matchesStatus && matchesDifficulty && matchesRole;
  });

  // Calculate stats
  const publishedCount = questions.filter((q) => q.status === "published").length;
  const draftCount = questions.filter((q) => q.status === "draft").length;
  const archivedCount = questions.filter((q) => q.status === "archived").length;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container py-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="h-9 w-48 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-5 w-64 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-10 w-32 animate-pulse rounded bg-muted" />
            </div>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
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
          <div className="mb-6">
            <Link href="/recruiters" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Roles
            </Link>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Questions Library</h1>
              <p className="mt-1 text-muted-foreground">Manage and reuse questions across multiple roles</p>
            </div>
            <Button asChild>
              <Link href="/recruiters/questions/new">
                <Plus className="mr-2 h-4 w-4" />
                New Question
              </Link>
            </Button>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <FileText className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{publishedCount}</div>
                <p className="text-xs text-muted-foreground">Active questions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                <Edit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{draftCount}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{questions.length}</div>
                <p className="text-xs text-muted-foreground">In library</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-6 flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="backend">Backend</SelectItem>
                <SelectItem value="fullstack">Fullstack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No questions found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery || statusFilter !== "all" || difficultyFilter !== "all" || roleFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Create your first question to get started"}
                  </p>
                  <Button asChild>
                    <Link href="/recruiters/questions/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New Question
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredQuestions.map((question) => {
                const attachedRoles = roles.filter((r) => r.questionIds.includes(question.id));
                return (
                  <Card key={question.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold">{question.title}</h3>
                            <Badge className={statusColors[question.status]} variant="secondary">
                              {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                            </Badge>
                            <Badge className={difficultyColors[question.difficulty]} variant="secondary">
                              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                            </Badge>
                            <Badge variant="outline">
                              {question.role.charAt(0).toUpperCase() + question.role.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{question.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {question.timeConstraints?.limit} {question.timeConstraints?.unit}
                            </span>
                            <span className="flex items-center gap-1">
                              <LinkIcon className="h-3 w-3" />
                              {attachedRoles.length} role{attachedRoles.length !== 1 ? "s" : ""}
                            </span>
                            {attachedRoles.length > 0 && (
                              <span className="text-muted-foreground">
                                ({attachedRoles.map((r) => r.title).join(", ")})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const roleId = attachedRoles[0]?.id ?? '';
                              setSelectedQuestion({ id: question.id, title: question.title });
                              setSelectedRoleId(roleId);
                              if (roleId) setSendDialogOpen(true);
                            }}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/recruiters/questions/${question.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link href={`/recruiters/questions/${question.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
      <Footer />

      {selectedQuestion && selectedRoleId && (
        <SendToCandidateDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          questionId={selectedQuestion.id}
          questionTitle={selectedQuestion.title}
          roleId={selectedRoleId}
        />
      )}
    </div>
  );
}
