import { Button } from "@/components/ui/button";
import type { QuestionRole, QuestionDifficulty } from "@/types/question-shared";

interface QuestionFiltersProps {
  selectedRole: QuestionRole | "all";
  selectedDifficulty: QuestionDifficulty | "all";
  onRoleChange: (role: QuestionRole | "all") => void;
  onDifficultyChange: (difficulty: QuestionDifficulty | "all") => void;
}

const roles: { value: QuestionRole | "all"; label: string }[] = [
  { value: "all", label: "All Roles" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "fullstack", label: "Fullstack" },
];

const difficulties: { value: QuestionDifficulty | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function QuestionFilters({
  selectedRole,
  selectedDifficulty,
  onRoleChange,
  onDifficultyChange,
}: QuestionFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Role:</span>
        {roles.map((role) => (
          <Button
            key={role.value}
            variant={selectedRole === role.value ? "default" : "outline"}
            size="sm"
            onClick={() => onRoleChange(role.value)}
            className="h-8"
          >
            {role.label}
          </Button>
        ))}
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Difficulty:</span>
        {difficulties.map((difficulty) => (
          <Button
            key={difficulty.value}
            variant={selectedDifficulty === difficulty.value ? "default" : "outline"}
            size="sm"
            onClick={() => onDifficultyChange(difficulty.value)}
            className="h-8"
          >
            {difficulty.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
