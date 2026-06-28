'use client';

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  availableLLMModels,
  availableTestFrameworks,
} from "@/lib/constants";
import { useRolesQuery, useSetRoleQuestionsMutation } from "@/hooks/api/roles";
import { useQuestionQuery, useCreateQuestionMutation, useUpdateQuestionMutation, useDeleteQuestionMutation } from "@/hooks/api/questions";
import type {
  QuestionRole,
  QuestionDifficulty,
  QuestionStatus,
  TimeConstraints,
  TestFrameworkType,
} from "@/types/question-shared";
import { QUESTION_ROLES, QUESTION_DIFFICULTIES, QUESTION_STATUSES } from "@/types/question-shared";
import { asEnum } from "@/lib/typeGuards";
import { ArrowLeft, GitBranch, Save, Trash2 } from "lucide-react";
import { RoleSelector } from "@/components/recruiters/RoleSelector";
import { toast } from "sonner";
import { useRecruiterQuestionForm } from "@/hooks/recruiter-question-editor/useRecruiterQuestionForm";

const statusColors: Record<QuestionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-500/10 text-green-600 dark:text-green-400",
  archived: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function StandaloneQuestionEditorPage({ params }: { params: Promise<{ questionId: string }> }) {
  return (
    <Suspense>
      <StandaloneQuestionEditorContent params={params} />
    </Suspense>
  );
}

function StandaloneQuestionEditorContent({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleId = searchParams.get("roleId");
  const isNew = questionId === "new";

  const { data: roles = [] } = useRolesQuery();
  const setRoleQuestionsMutation = useSetRoleQuestionsMutation();

  const { data: existingQuestion = null, isLoading: questionLoading } = useQuestionQuery(isNew ? '' : questionId);
  const createMutation = useCreateQuestionMutation();
  const updateMutation = useUpdateQuestionMutation();
  const deleteMutation = useDeleteQuestionMutation();

  const attachedRoles = isNew ? [] : roles.filter((r) => r.questionIds.includes(questionId));

  const {
    title,
    setTitle,
    description,
    setDescription,
    questionRole,
    setQuestionRole,
    difficulty,
    setDifficulty,
    repositoryUrl,
    setRepositoryUrl,
    startingBranch,
    setStartingBranch,
    targetBranch,
    setTargetBranch,
    status,
    setStatus,
    testConfig,
    setTestConfig,
    timeConstraints,
    setTimeConstraints,
    aiPermissions,
    setAIPermissions,
  } = useRecruiterQuestionForm(existingQuestion);
  const [newQuestionRoleIds, setNewQuestionRoleIds] = useState<string[]>(
    roleId ? [roleId] : []
  );

  const toggleModel = (model: string) => {
    setAIPermissions((prev) => ({
      ...prev,
      allowedModels: prev.allowedModels.includes(model)
        ? prev.allowedModels.filter((m) => m !== model)
        : [...prev.allowedModels, model],
    }));
  };

  const handleSave = async () => {
    const input = {
      title,
      description,
      role: questionRole,
      difficulty,
      status,
      repositoryUrl,
      startingBranch,
      targetBranch,
      timeLimitValue: timeConstraints.limit,
      timeLimitUnit: timeConstraints.unit,
      hardStop: timeConstraints.hardStop,
      allowedModels: aiPermissions.allowedModels,
      isPublic: false,
    };

    if (isNew) {
      const created = await createMutation.mutateAsync(input);
      const rolesToAttach = newQuestionRoleIds.filter(Boolean);
      for (const rid of rolesToAttach) {
        const role = roles.find((r) => r.id === rid);
        if (role) {
          const updatedIds = [...new Set([...role.questionIds, created.id])];
          await setRoleQuestionsMutation.mutateAsync({ id: rid, questionIds: updatedIds });
        }
      }
      toast.success(rolesToAttach.length > 0 ? "Question created and attached to role(s)" : "Question created successfully");
    } else {
      await updateMutation.mutateAsync({ id: questionId, data: input });
      toast.success("Question saved successfully");
    }

    router.push(roleId ? `/recruiters/roles/${roleId}` : "/recruiters/questions");
  };

  const handleDelete = async () => {
    if (!isNew) {
      for (const role of attachedRoles) {
        const updatedIds = role.questionIds.filter((qid) => qid !== questionId);
        await setRoleQuestionsMutation.mutateAsync({ id: role.id, questionIds: updatedIds });
      }
      await deleteMutation.mutateAsync({ id: questionId });
      toast.success("Question deleted successfully");
      router.push(roleId ? `/recruiters/roles/${roleId}` : "/recruiters/questions");
    }
  };

  const handleRoleSelectionChange = async (selectedRoleIds: string[]) => {
    if (isNew) return;

    const currentRoleIds = attachedRoles.map((r) => r.id);
    const rolesToAttach = selectedRoleIds.filter((id) => !currentRoleIds.includes(id));
    const rolesToDetach = currentRoleIds.filter((id) => !selectedRoleIds.includes(id));

    for (const id of rolesToAttach) {
      const role = roles.find((r) => r.id === id);
      if (role) {
        const updatedIds = [...new Set([...role.questionIds, questionId])];
        await setRoleQuestionsMutation.mutateAsync({ id: id, questionIds: updatedIds });
      }
    }
    for (const id of rolesToDetach) {
      const role = roles.find((r) => r.id === id);
      if (role) {
        const updatedIds = role.questionIds.filter((qid) => qid !== questionId);
        await setRoleQuestionsMutation.mutateAsync({ id: id, questionIds: updatedIds });
      }
    }

    if (rolesToAttach.length > 0 || rolesToDetach.length > 0) {
      toast.success("Role attachments updated");
    }
  };

  if (!isNew && questionLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container max-w-4xl py-8">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
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
        <div className="container max-w-4xl py-8">
          <div className="mb-6">
            <Link
              href={roleId ? `/recruiters/roles/${roleId}` : "/recruiters/questions"}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {roleId ? "Back to Role" : "Back to Questions Library"}
            </Link>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{isNew ? "New Question" : "Edit Question"}</h1>
              <p className="text-muted-foreground">
                {isNew ? "Create a new standalone question" : "Edit question details"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={(v) => { const s = asEnum(v, QUESTION_STATUSES); if (s) setStatus(s); }}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>

          {!roleId && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Role Attachments</CardTitle>
                <CardDescription>
                  {isNew
                    ? "Optionally attach this question to a role after saving"
                    : "Manage which roles this question is attached to"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RoleSelector
                  allRoles={roles}
                  selectedIds={isNew ? newQuestionRoleIds : attachedRoles.map((r) => r.id)}
                  onSelectionChange={isNew ? setNewQuestionRoleIds : handleRoleSelectionChange}
                />
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Question Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., React Component Refactoring"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the task and expectations..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technical Configuration</CardTitle>
                <CardDescription>Define the role and difficulty for this question</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={questionRole} onValueChange={(v) => { const r = asEnum(v, QUESTION_ROLES); if (r) setQuestionRole(r); }}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="frontend">Frontend</SelectItem>
                        <SelectItem value="backend">Backend</SelectItem>
                        <SelectItem value="fullstack">Fullstack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={difficulty} onValueChange={(v) => { const d = asEnum(v, QUESTION_DIFFICULTIES); if (d) setDifficulty(d); }}>
                      <SelectTrigger id="difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  GitHub Repository
                </CardTitle>
                <CardDescription>Configure the repository and branches for this question</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="repository">Repository URL</Label>
                  <Input
                    id="repository"
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/org/repo"
                  />
                  <p className="text-sm text-muted-foreground">This repo will be cloned for candidates</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startingBranch">Starting Branch</Label>
                    <Input
                      id="startingBranch"
                      value={startingBranch}
                      onChange={(e) => setStartingBranch(e.target.value)}
                      placeholder="main"
                    />
                    <p className="text-sm text-muted-foreground">
                      The branch candidates will start from
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetBranch">Target Branch</Label>
                    <Input
                      id="targetBranch"
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      placeholder="solution"
                    />
                    <p className="text-sm text-muted-foreground">
                      The branch their solution will be compared against
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Testing Configuration
                  <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                </CardTitle>
                <CardDescription>Configure how candidate solutions will be tested</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="testCommand">Test Command</Label>
                    <Input
                      id="testCommand"
                      value={testConfig.command}
                      disabled
                      placeholder="e.g., npm test, pytest"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testFramework">Test Framework</Label>
                    <Select value={testConfig.framework} disabled>
                      <SelectTrigger id="testFramework">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTestFrameworks.map((tf) => (
                          <SelectItem key={tf.id} value={tf.id}>
                            {tf.name} ({tf.language})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Constraints & AI Usage</CardTitle>
                <CardDescription>Configure AI model access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Time Limit</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={1}
                        value={timeConstraints.limit}
                        onChange={(e) =>
                          setTimeConstraints((prev) => ({ ...prev, limit: Number(e.target.value) }))
                        }
                        className="w-24"
                      />
                      <Select
                        value={timeConstraints.unit}
                        onValueChange={(v) =>
                          setTimeConstraints((prev) => ({ ...prev, unit: v as TimeConstraints['unit'] }))
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="text-sm font-medium">Hard Stop</div>
                      <p className="text-xs text-muted-foreground">
                        Automatically lock when time expires
                      </p>
                    </div>
                    <Switch
                      checked={timeConstraints.hardStop}
                      onCheckedChange={(checked) =>
                        setTimeConstraints((prev) => ({ ...prev, hardStop: checked }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Allowed Models</div>
                      <p className="text-xs text-muted-foreground">Select which models are permitted</p>
                    </div>
                    <Badge variant="secondary">
                      {aiPermissions.allowedModels.length} selected
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    {availableLLMModels.map((model) => (
                      <label key={model.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <Checkbox
                          checked={aiPermissions.allowedModels.includes(model.id)}
                          onCheckedChange={() => toggleModel(model.id)}
                        />
                        <div>
                          <div className="text-sm font-medium">{model.name}</div>
                          <p className="text-xs text-muted-foreground">{model.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isNew && (
              <Card>
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                  <CardDescription>Delete this question</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <div>
                      <div className="text-sm font-semibold text-destructive">Delete Question</div>
                      <p className="text-sm text-destructive/80">
                        This action cannot be undone. The question will be removed from all attached roles.
                      </p>
                      {attachedRoles.length > 0 && (
                        <p className="text-sm text-destructive/80 mt-1">
                          Currently attached to {attachedRoles.length} role{attachedRoles.length !== 1 ? "s" : ""}.
                        </p>
                      )}
                    </div>
                    <Button variant="destructive" onClick={handleDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
