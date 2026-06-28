import Link from "next/link";
import { ArrowLeft, Bug, Clock, FileText, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// TODO: REMOVE IN PRODUCTION - Debug mode imports
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/stores/settingsStore";

interface QuestionTopBarProps {
  questionId: string;
  timerFormatted: string;
  onShowSpec: () => void;
  onEndQuestion: () => void;
  hasStarted: boolean;
  hasChatHistory: boolean;
  isSubmitting: boolean;
}

export function QuestionTopBar({
  questionId,
  timerFormatted,
  onShowSpec,
  onEndQuestion,
  hasStarted,
  hasChatHistory,
  isSubmitting,
}: QuestionTopBarProps) {
  // TODO: REMOVE IN PRODUCTION - Debug mode toggle
  const debugMode = useSettingsStore((state) => state.debugMode);
  const toggleDebugMode = useSettingsStore((state) => state.toggleDebugMode);
  const hasDebugSandbox = useSettingsStore((state) => state.hasDebugSandbox());

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/questions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          Question #{questionId}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono font-medium tabular-nums" data-testid="timer">
            {timerFormatted}
          </span>
        </div>

        {/* TODO: REMOVE IN PRODUCTION - Debug mode toggle */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Bug className={`h-4 w-4 ${debugMode ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <Switch
                checked={debugMode}
                onCheckedChange={toggleDebugMode}
                className="data-[state=checked]:bg-orange-500"
              />
              <span className={`text-xs font-medium ${debugMode ? 'text-orange-500' : 'text-muted-foreground'}`}>
                DEBUG
                {debugMode && hasDebugSandbox && (
                  <span className="ml-1 text-[10px] opacity-70">(cached)</span>
                )}
              </span>
            </div>
          </>
        )}

        <div className="h-4 w-px bg-border" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onShowSpec}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <FileText className="h-4 w-4" />
          Spec
        </Button>

        {hasStarted && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5" disabled={!hasChatHistory}>
                <Square className="h-3.5 w-3.5" />
                End Question
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit your solution?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div>
                    Before submitting, please make sure you have:
                    <ul className="mt-2 list-disc pl-5">
                      <li>Answered all the requirements</li>
                      <li>All tests are passing</li>
                    </ul>
                    <p className="mt-2">This action cannot be undone.</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Go back</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    // Keep the dialog open so the spinner stays visible until the redirect.
                    e.preventDefault();
                    onEndQuestion();
                  }}
                  disabled={isSubmitting}
                  className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Submitting…" : "Submit"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </header>
  );
}
