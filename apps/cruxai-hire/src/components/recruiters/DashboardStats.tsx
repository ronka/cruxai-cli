'use client';

import { StatCard } from "./StatCard";
import { Briefcase, Users, Clock, TrendingUp } from "lucide-react";

interface DashboardStatsProps {
  totalRoles: number;
  openRoles: number;
  totalCandidates: number;
  pendingReviews: number;
  avgTimeToReview?: number;
}

export function DashboardStats({
  totalRoles,
  openRoles,
  totalCandidates,
  pendingReviews,
  avgTimeToReview,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Roles"
        value={totalRoles}
        icon={Briefcase}
        description={`${openRoles} currently open`}
      />
      <StatCard
        title="Total Candidates"
        value={totalCandidates}
        icon={Users}
        description="Across all roles"
      />
      <StatCard
        title="Pending Reviews"
        value={pendingReviews}
        icon={Clock}
        description="Awaiting evaluation"
      />
      <StatCard
        title="Avg. Review Time"
        value={avgTimeToReview ? `${avgTimeToReview}h` : "N/A"}
        icon={TrendingUp}
        description="Time to complete review"
      />
    </div>
  );
}
