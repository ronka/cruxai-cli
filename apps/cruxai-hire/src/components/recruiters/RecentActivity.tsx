'use client';

import { Badge } from "@/components/ui/badge";
import type { Invite, Submission, JobRole, Candidate } from "@/types/recruiter";
import { UserPlus, FileCheck, ClipboardCheck, Briefcase } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'candidate_invited' | 'candidate_submitted' | 'candidate_reviewed' | 'role_created';
  title: string;
  subtitle: string;
  timestamp: string;
}

interface RecentActivityProps {
  invites: Invite[];
  submissions: Submission[];
  candidates: Candidate[];
  roles: JobRole[];
  limit?: number;
}

export function RecentActivity({ invites, submissions, candidates, roles, limit = 5 }: RecentActivityProps) {
  const candidateMap = new Map(candidates.map((c) => [c.id, c]));
  const roleMap = new Map(roles.map((r) => [r.id, r]));
  const inviteMap = new Map(invites.map((i) => [i.id, i]));

  const activities: ActivityItem[] = [];

  // Invite created = candidate invited
  invites.forEach((invite) => {
    const candidate = candidateMap.get(invite.candidateId);
    const role = roleMap.get(invite.roleId);
    activities.push({
      id: `invite-${invite.id}`,
      type: 'candidate_invited',
      title: `${candidate?.name ?? 'Unknown'} invited`,
      subtitle: role?.title ?? 'Unknown role',
      timestamp: invite.createdAt,
    });
  });

  // Submissions
  submissions.forEach((sub) => {
    const invite = sub.inviteId ? inviteMap.get(sub.inviteId) : undefined;
    const candidate = invite ? candidateMap.get(invite.candidateId) : undefined;
    const role = invite ? roleMap.get(invite.roleId) : undefined;
    const name = candidate?.name ?? 'Unknown';
    const subtitle = role?.title ?? 'Unknown role';

    if (sub.submittedAt) {
      activities.push({
        id: `submit-${sub.id}`,
        type: 'candidate_submitted',
        title: `${name} submitted`,
        subtitle,
        timestamp: sub.submittedAt,
      });
    }
    if (sub.reviewedAt) {
      activities.push({
        id: `review-${sub.id}`,
        type: 'candidate_reviewed',
        title: `${name} reviewed`,
        subtitle,
        timestamp: sub.reviewedAt,
      });
    }
  });

  // Role creation
  roles.forEach((role) => {
    activities.push({
      id: `role-${role.id}`,
      type: 'role_created',
      title: `${role.title} created`,
      subtitle: `Created ${new Date(role.createdAt).toLocaleDateString()}`,
      timestamp: new Date(role.createdAt).toISOString(),
    });
  });

  const sortedActivities = activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'candidate_invited': return <UserPlus className="h-4 w-4" />;
      case 'candidate_submitted': return <FileCheck className="h-4 w-4" />;
      case 'candidate_reviewed': return <ClipboardCheck className="h-4 w-4" />;
      case 'role_created': return <Briefcase className="h-4 w-4" />;
    }
  };

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'candidate_invited': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">Invited</Badge>;
      case 'candidate_submitted': return <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">Submitted</Badge>;
      case 'candidate_reviewed': return <Badge variant="secondary" className="bg-green-500/10 text-green-600">Reviewed</Badge>;
      case 'role_created': return <Badge variant="secondary" className="bg-muted text-muted-foreground">Created</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (sortedActivities.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No recent activity. Start by creating a role or inviting candidates.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="divide-y">
        {sortedActivities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-muted p-2">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.title}</p>
              <p className="text-xs text-muted-foreground truncate">{activity.subtitle}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {getActivityBadge(activity.type)}
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(activity.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
