'use client';

import { useState } from "react";
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
import { useCandidatesQuery } from "@/hooks/api/candidates";
import { useCreateInviteLink } from "@/hooks/create-invite-link/useCreateInviteLink";
import { InviteLinkSuccess } from "@/components/recruiters/InviteLinkSuccess";
import { Send } from "lucide-react";

interface SendToCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  questionTitle: string;
  roleId: string;
}

export function SendToCandidateDialog({
  open,
  onOpenChange,
  questionId,
  questionTitle,
  roleId,
}: SendToCandidateDialogProps) {
  const { data: candidates = [] } = useCandidatesQuery();
  const { isSubmitting, generatedLink, copied, error, submit, copy, reset } =
    useCreateInviteLink();
  const [selectedCandidateId, setSelectedCandidateId] = useState("");

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
      setSelectedCandidateId("");
    }
    onOpenChange(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId) return;
    void submit({ candidateId: selectedCandidateId, roleId, questionId });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send to Candidate
          </DialogTitle>
          <DialogDescription>
            Create an assessment link for &quot;{questionTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          <InviteLinkSuccess
            link={generatedLink}
            copied={copied}
            onCopy={copy}
            onDone={() => handleOpenChange(false)}
            recipient={selectedCandidate?.name}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="candidate-select">Candidate</Label>
                <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
                  <SelectTrigger id="candidate-select">
                    {selectedCandidate ? (
                      <span>{selectedCandidate.name}</span>
                    ) : (
                      <SelectValue placeholder="Select a candidate..." />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{candidate.name}</span>
                          <span className="text-xs text-current opacity-70">{candidate.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedCandidateId || isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Link"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
