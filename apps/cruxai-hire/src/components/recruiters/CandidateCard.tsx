'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CandidateStatus } from "@/types/recruiter";
import type { InvitePipelineItem } from "@/types/pipeline";
import { Mail, Calendar, Briefcase } from "lucide-react";

const statusConfig: Record<CandidateStatus, { label: string; className: string }> = {
  invited: { label: "Invited", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  started: { label: "In Progress", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  submitted: { label: "Submitted", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  reviewed: { label: "Reviewed", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
};

interface CandidateCardProps {
  item: InvitePipelineItem;
  onClick?: () => void;
}

export function CandidateCard({ item, onClick }: CandidateCardProps) {
  const { candidate, status, roleName, invite } = item;
  const config = statusConfig[status];
  const invitedDate = new Date(invite.createdAt).toLocaleDateString();

  return (
    <Card
      className={onClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="font-medium truncate">{candidate.name}</p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{candidate.email}</span>
            </div>
            {roleName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3 shrink-0" />
                <span className="truncate">{roleName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>Invited {invitedDate}</span>
            </div>
          </div>
          <Badge className={config.className} variant="secondary">
            {config.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
