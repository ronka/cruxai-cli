'use client';

import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { QuestionFilters } from "@/components/questions/QuestionFilters";
import { Button } from "@/components/ui/button";
import type { QuestionRole, QuestionDifficulty } from "@/types/question-shared";
import { Code2, Plus } from "lucide-react";
import { useQuestionsQuery } from "@/hooks/api/questions";
import { useQueryState, parseAsString } from "nuqs";

export default function QuestionsPage() {
  return (
    <Suspense>
      <QuestionsContent />
    </Suspense>
  );
}

function QuestionsContent() {
  const [selectedRoleParam, setSelectedRole] = useQueryState("role", parseAsString.withDefault("all").withOptions({ history: "push" }));
  const [selectedDifficultyParam, setSelectedDifficulty] = useQueryState("difficulty", parseAsString.withDefault("all").withOptions({ history: "push" }));
  const selectedRole = selectedRoleParam as QuestionRole | "all";
  const selectedDifficulty = selectedDifficultyParam as QuestionDifficulty | "all";

  const { data: questions = [] } = useQuestionsQuery({ status: 'published' });

  const filteredQuestions = questions.filter((q) => {
    const matchesRole = selectedRole === "all" || q.role === selectedRole;
    const matchesDifficulty = selectedDifficulty === "all" || q.difficulty === selectedDifficulty;
    return matchesRole && matchesDifficulty;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border/40 bg-muted/30">
          <div className="container py-12">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Code2 className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Questions</h1>
              </div>
              <Button asChild>
                <Link href="/questions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Link>
              </Button>
            </div>
            <p className="max-w-2xl text-muted-foreground">
              Explore our curated collection of AI-focused interview questions.
              Filter by role and difficulty to find the perfect challenges for your interviews.
            </p>
          </div>
        </section>

        <section className="container py-8">
          <div className="mb-6">
            <QuestionFilters
              selectedRole={selectedRole}
              selectedDifficulty={selectedDifficulty}
              onRoleChange={setSelectedRole}
              onDifficultyChange={setSelectedDifficulty}
            />
          </div>

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredQuestions.length} of {questions.length} questions
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {filteredQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Code2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium">No questions found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters to see more questions.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
