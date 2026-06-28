'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Question, QuestionStatus, QuestionDifficulty } from "@/types/question-shared";
import { X } from "lucide-react";
import { AttachQuestionsDialog } from "@/components/recruiters/AttachQuestionsDialog";

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

interface QuestionSelectorProps {
  allQuestions: Question[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function QuestionSelector({
  allQuestions,
  selectedIds,
  onSelectionChange,
  disabled = false,
}: QuestionSelectorProps) {
  const selectedQuestions = allQuestions.filter((q) => selectedIds.includes(q.id));

  const handleRemove = (questionId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== questionId));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Attached Questions ({selectedIds.length})</div>
        <AttachQuestionsDialog
          allQuestions={allQuestions}
          selectedIds={selectedIds}
          onConfirm={onSelectionChange}
          disabled={disabled}
        />
      </div>

      {selectedQuestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No questions attached. Click &quot;Attach Questions&quot; to add questions from the library.
        </p>
      ) : (
        <div className="space-y-2">
          {selectedQuestions.map((question) => (
            <div
              key={question.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{question.title}</span>
                <Badge className={statusColors[question.status]} variant="secondary">
                  {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                </Badge>
                <Badge className={difficultyColors[question.difficulty]} variant="secondary">
                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(question.id)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
