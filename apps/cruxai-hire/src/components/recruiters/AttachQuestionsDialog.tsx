'use client';

import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Question, QuestionDifficulty } from "@/types/question-shared";
import { Clock, Plus, Search } from "lucide-react";

const difficultyColors: Record<QuestionDifficulty, string> = {
  easy: "bg-green-500/10 text-green-600 dark:text-green-400",
  medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface AttachQuestionsDialogProps {
  allQuestions: Question[];
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
  disabled?: boolean;
  trigger?: ReactNode;
}

export function AttachQuestionsDialog({
  allQuestions,
  selectedIds,
  onConfirm,
  disabled = false,
  trigger,
}: AttachQuestionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);

  const publishedQuestions = allQuestions.filter((q) => q.status === "published");

  const filteredQuestions = publishedQuestions.filter(
    (q) =>
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTempSelectedIds(selectedIds);
      setSearchQuery("");
    }
    setOpen(newOpen);
  };

  const toggleQuestion = (questionId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleConfirm = () => {
    onConfirm(tempSelectedIds);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" disabled={disabled}>
            <Plus className="mr-2 h-4 w-4" />
            Attach Questions
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Attach Questions to Role</DialogTitle>
          <DialogDescription>
            Select questions from the library to attach to this role. Only published questions are shown.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-3">
              {filteredQuestions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {searchQuery
                    ? "No questions match your search"
                    : "No published questions available"}
                </p>
              ) : (
                filteredQuestions.map((question) => (
                  <label
                    key={question.id}
                    className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={tempSelectedIds.includes(question.id)}
                      onCheckedChange={() => toggleQuestion(question.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{question.title}</span>
                        <Badge className={difficultyColors[question.difficulty]} variant="secondary">
                          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                        </Badge>
                        <Badge variant="outline">
                          {question.role.charAt(0).toUpperCase() + question.role.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {question.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {question.timeConstraints?.limit} {question.timeConstraints?.unit}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{tempSelectedIds.length} question(s) selected</span>
            <span>{publishedQuestions.length} published questions available</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Attach {tempSelectedIds.length} Question{tempSelectedIds.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
