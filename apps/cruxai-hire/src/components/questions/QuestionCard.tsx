import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Question } from "@/types/question-shared";

interface QuestionCardProps {
  question: Question;
}

const roleColors = {
  frontend: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
  backend: "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20",
  fullstack: "bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20",
};

const difficultyColors = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-destructive",
};

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <Link
      href={`/questions/${question.id}`}
      className="group flex items-center justify-between rounded-lg border border-border/50 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        {/* <span className="min-w-[3rem] text-sm font-medium text-muted-foreground">
          #{question.id}
        </span> */}
        <div className="flex flex-col gap-1">
          <h3 className="font-medium transition-colors group-hover:text-primary">
            {question.title}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={roleColors[question.role]}>
              {question.role}
            </Badge>
            <span className={`text-xs font-medium capitalize ${difficultyColors[question.difficulty]}`}>
              {question.difficulty}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        {question.timeConstraints && (
          <>
            <span className="text-sm font-medium">{question.timeConstraints.limit} {question.timeConstraints.unit}</span>
            <p className="text-xs text-muted-foreground">Time Limit</p>
          </>
        )}
      </div>
    </Link>
  );
}
