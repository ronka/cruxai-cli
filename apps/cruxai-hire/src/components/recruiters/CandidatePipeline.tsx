'use client';

import { CandidateCard } from "./CandidateCard";
import type { CandidateStatus } from "@/types/recruiter";
import type { InvitePipelineItem } from "@/types/pipeline";
import { Users } from "lucide-react";

interface PipelineColumn {
  status: CandidateStatus;
  title: string;
  description: string;
}

const columns: PipelineColumn[] = [
  { status: "invited", title: "Invited", description: "Awaiting candidate response" },
  { status: "started", title: "In Progress", description: "Currently working on assessment" },
  { status: "submitted", title: "Submitted", description: "Ready for review" },
  { status: "reviewed", title: "Reviewed", description: "Evaluation completed" },
];

interface CandidatePipelineProps {
  items: InvitePipelineItem[];
  onItemClick?: (item: InvitePipelineItem) => void;
}

export function CandidatePipeline({ items, onItemClick }: CandidatePipelineProps) {
  const getItemsByStatus = (status: CandidateStatus) =>
    items.filter((item) => item.status === status);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No candidates yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Invite candidates to start building your pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((column) => {
        const columnItems = getItemsByStatus(column.status);
        return (
          <div key={column.status} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{column.title}</h3>
                <p className="text-xs text-muted-foreground">{column.description}</p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {columnItems.length}
              </span>
            </div>
            <div className="space-y-2">
              {columnItems.map((item) => (
                <CandidateCard
                  key={item.invite.id}
                  item={item}
                  onClick={onItemClick ? () => onItemClick(item) : undefined}
                />
              ))}
              {columnItems.length === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-xs text-muted-foreground">No candidates</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
