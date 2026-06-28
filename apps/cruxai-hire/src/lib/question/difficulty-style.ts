import type { QuestionDifficulty } from "@/types/question-shared";

// Foreground text color (used for inline labels)
export const difficultyTextColors: Record<QuestionDifficulty, string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-destructive",
};

// Soft badge background + text color (used for table badges)
export const difficultyBadgeColors: Record<QuestionDifficulty, string> = {
  easy: "bg-green-500/10 text-green-600 dark:text-green-400",
  medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};
