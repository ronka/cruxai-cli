'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useInviteCandidateForm } from "@/hooks/invite-candidate/useInviteCandidateForm";
import { useCreateCandidateMutation } from "@/hooks/api/candidates";

interface InviteCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteCandidateDialog({
  open,
  onOpenChange,
}: InviteCandidateDialogProps) {
  const form = useInviteCandidateForm();
  const createCandidate = useCreateCandidateMutation();

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.isValid) return;

    form.setIsSubmitting(true);
    try {
      const data = form.getFormData();
      const result = await createCandidate.mutateAsync({
        name: data.name,
        email: data.email,
        ...(data.notes && { notes: data.notes }),
      });
      if (result.created) {
        toast.success(`Added ${result.candidate.name}`);
      } else {
        toast.info(`${result.candidate.name} is already in your pipeline`);
      }
      handleOpenChange(false);
    } finally {
      form.setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Candidate
          </DialogTitle>
          <DialogDescription>
            Add a candidate to your hiring pipeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="candidate-name">Full Name</Label>
              <Input
                id="candidate-name"
                value={form.name}
                onChange={(e) => form.setName(e.target.value)}
                placeholder="e.g., John Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-email">Email Address</Label>
              <Input
                id="candidate-email"
                type="email"
                value={form.email}
                onChange={(e) => form.setEmail(e.target.value)}
                placeholder="e.g., john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-notes">Notes (optional)</Label>
              <Textarea
                id="candidate-notes"
                value={form.notes}
                onChange={(e) => form.setNotes(e.target.value)}
                placeholder="Add any notes about this candidate..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!form.isValid || form.isSubmitting}>
              {form.isSubmitting ? "Adding..." : "Add Candidate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
