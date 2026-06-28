'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useCreateQuestionMutation } from "@/hooks/api/questions";
import { availableTestFrameworks, availableLLMModels } from "@/lib/constants";
import type { QuestionRole, QuestionDifficulty, GitHubRepository, TestConfig, TestFrameworkType, AIPermissions } from "@/types/question-shared";
import { QUESTION_ROLES, QUESTION_DIFFICULTIES } from "@/types/question-shared";
import { asEnum } from "@/lib/typeGuards";
import { ArrowLeft, GitBranch, Save } from "lucide-react";
import { toast } from "sonner";

export default function NewCandidateQuestionPage() {
  const router = useRouter();
  const createMutation = useCreateQuestionMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState<QuestionRole>("frontend");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>("medium");

  // Repository state
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [repositoryUrlError, setRepositoryUrlError] = useState("");
  const [startingBranch, setStartingBranch] = useState("main");
  const [targetBranch, setTargetBranch] = useState("solution");

  // Test config state (disabled — coming soon)
  const [testFramework] = useState<TestFrameworkType>("jest");

  // AI permissions state
  const [aiPermissions, setAIPermissions] = useState<AIPermissions>({
    allowedModels: [],
  });

  const toggleModel = (model: string) => {
    setAIPermissions((prev) => ({
      ...prev,
      allowedModels: prev.allowedModels.includes(model)
        ? prev.allowedModels.filter((m) => m !== model)
        : [...prev.allowedModels, model],
    }));
  };

  const validateRepositoryUrl = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setRepositoryUrlError("");
      return false;
    }

    const isValid = trimmedValue.endsWith('.git');
    setRepositoryUrlError(isValid ? "" : "Repository URL must end with .git");
    return isValid;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!repositoryUrl.trim()) {
      toast.error("Please enter a repository URL");
      return;
    }

    if (!validateRepositoryUrl(repositoryUrl)) {
      toast.error("Repository URL must end with .git");
      return;
    }

    const repository: GitHubRepository = {
      url: repositoryUrl.trim(),
      startingBranch: startingBranch.trim() || "main",
      targetBranch: targetBranch.trim() || "solution",
    };

    const testConfig: TestConfig = {
      command: "npm test",
      framework: testFramework,
      timeout: 30000,
    };

    void testConfig; // will be used once testing config is enabled

    await createMutation.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      role,
      difficulty,
      repositoryUrl: repository.url,
      startingBranch: repository.startingBranch,
      targetBranch: repository.targetBranch,
      status: 'published',
      hardStop: false,
      allowedModels: aiPermissions.allowedModels,
      isPublic: false,
    });
    toast.success("Question created successfully");
    router.push("/questions");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container max-w-4xl py-8">
          <div className="mb-6">
            <Link
              href="/questions"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Questions
            </Link>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">New Question</h1>
              <p className="text-muted-foreground">Create a new candidate question</p>
            </div>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>

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
                    placeholder="e.g., Build a React Todo App with Local Storage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief summary of the question..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Define the role and difficulty</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(v) => { const r = asEnum(v, QUESTION_ROLES); if (r) setRole(r); }}>
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
                    onChange={(e) => {
                      setRepositoryUrl(e.target.value);
                      if (repositoryUrlError) {
                        validateRepositoryUrl(e.target.value);
                      }
                    }}
                    onBlur={(e) => {
                      if (!validateRepositoryUrl(e.target.value)) {
                        toast.error("Repository URL must end with .git");
                      }
                    }}
                    placeholder="https://github.com/org/repo.git"
                  />
                  {repositoryUrlError ? (
                    <p className="text-sm text-destructive">{repositoryUrlError}</p>
                  ) : null}
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetBranch">Target Branch</Label>
                    <Input
                      id="targetBranch"
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      placeholder="solution"
                    />
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
                    <Label>Test Command</Label>
                    <Input value="npm test" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Test Framework</Label>
                    <Select value={testFramework} disabled>
                      <SelectTrigger>
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
                <CardTitle>AI Model Access</CardTitle>
                <CardDescription>Select which models candidates can use</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
