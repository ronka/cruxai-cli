import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Question } from "@/types/question-shared";
import { Clock, Target } from "lucide-react";

interface QuestionSpecModalProps {
  question: Question;
  open: boolean;
  onStart: () => void;
  onClose: () => void;
  hasStarted: boolean;
}

const roleColors = {
  frontend: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  backend: "bg-green-500/10 text-green-600 dark:text-green-400",
  fullstack: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

const difficultyColors = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-destructive",
};

export function QuestionSpecModal({
  question,
  open,
  onStart,
  onClose,
  hasStarted,
}: QuestionSpecModalProps) {
  return (
    <Dialog open={open} onOpenChange={hasStarted ? onClose : undefined}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="font-mono">
              #{question.id}
            </Badge>
            <Badge variant="secondary" className={roleColors[question.role]}>
              {question.role}
            </Badge>
          </div>
          <DialogTitle className="text-xl">{question.title}</DialogTitle>
          <DialogDescription className="pt-2">
            {question.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/50 p-2 sm:p-3">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <span className={`text-xs sm:text-sm font-medium capitalize ${difficultyColors[question.difficulty]}`}>
                {question.difficulty}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Difficulty</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/50 p-2 sm:p-3">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">
                {question.timeConstraints ? `${question.timeConstraints.limit} ${question.timeConstraints.unit}` : '~30 min'}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Time Limit</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          {hasStarted ? (
            <Button onClick={onClose}>Close</Button>
          ) : (
            <Button onClick={onStart} className="w-full">
              Start Challenge
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
