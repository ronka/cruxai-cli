'use client';

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuestionsQuery } from "@/hooks/api/questions";
import { useRolesQuery } from "@/hooks/api/roles";
import { useCreateInviteLink } from "@/hooks/create-invite-link/useCreateInviteLink";
import { InviteLinkSuccess } from "@/components/recruiters/InviteLinkSuccess";
import { Send } from "lucide-react";

interface SendQuestionToCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
}

export function SendQuestionToCandidateDialog({
  open,
  onOpenChange,
  candidateId,
  candidateName,
}: SendQuestionToCandidateDialogProps) {
  const { data: questions = [] } = useQuestionsQuery();
  const { data: roles = [] } = useRolesQuery();
  const { isSubmitting, generatedLink, copied, error, submit, copy, reset } =
    useCreateInviteLink();

  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const matchingRoles = useMemo(
    () => (selectedQuestionId ? roles.filter((r) => r.questionIds?.includes(selectedQuestionId)) : []),
    [roles, selectedQuestionId],
  );

  // Auto-pick the role when there's exactly one; reset selection when the question changes.
  useEffect(() => {
    setSelectedRoleId(matchingRoles.length === 1 ? matchingRoles[0]!.id : "");
  }, [matchingRoles]);

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);
  const canSubmit = !!selectedQuestionId && !!selectedRoleId && !isSubmitting;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
      setSelectedQuestionId("");
      setSelectedRoleId("");
    }
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    void submit({ candidateId, roleId: selectedRoleId, questionId: selectedQuestionId });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Question
          </DialogTitle>
          <DialogDescription>
            Create an assessment link for {candidateName}.
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          <InviteLinkSuccess
            link={generatedLink}
            copied={copied}
            onCopy={copy}
            onDone={() => handleOpenChange(false)}
            recipient={candidateName}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question-select">Question</Label>
                <Select value={selectedQuestionId} onValueChange={setSelectedQuestionId}>
                  <SelectTrigger id="question-select">
                    {selectedQuestion ? (
                      <span>{selectedQuestion.title}</span>
                    ) : (
                      <SelectValue placeholder="Select a question..." />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {questions.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No questions yet.
                      </div>
                    ) : (
                      questions.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          {q.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedQuestionId && matchingRoles.length === 0 && (
                <p className="text-xs text-destructive">
                  This question isn&apos;t attached to any role yet. Attach it to a role first, then try again.
                </p>
              )}

              {matchingRoles.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="role-select">Role</Label>
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger id="role-select">
                      <SelectValue placeholder="This question is on multiple roles — pick one..." />
                    </SelectTrigger>
                    <SelectContent>
                      {matchingRoles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {matchingRoles.length === 1 && (
                <p className="text-xs text-muted-foreground">
                  Will be sent under role: <span className="font-medium">{matchingRoles[0]!.title}</span>
                </p>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isSubmitting ? "Creating..." : "Create Link"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
