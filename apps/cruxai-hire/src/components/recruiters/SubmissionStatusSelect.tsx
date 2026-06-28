'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SubmissionStatus } from "@/types/recruiter";
import { SUBMISSION_STATUSES } from "@/types/recruiter";
import { useUpdateSubmissionStatusMutation } from "@/hooks/api/submissions";
import { asEnum } from "@/lib/typeGuards";

const STATUS_OPTIONS: { value: SubmissionStatus; label: string }[] = [
  { value: "in_progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
];

interface SubmissionStatusSelectProps {
  submissionId: string;
  currentStatus: SubmissionStatus;
}

export function SubmissionStatusSelect({ submissionId, currentStatus }: SubmissionStatusSelectProps) {
  const updateStatusMutation = useUpdateSubmissionStatusMutation();

  return (
    <Select
      value={currentStatus}
      onValueChange={(value) => { const s = asEnum(value, SUBMISSION_STATUSES); if (s) updateStatusMutation.mutate({ id: submissionId, status: s }); }}
    >
      <SelectTrigger className="w-36 h-7 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
