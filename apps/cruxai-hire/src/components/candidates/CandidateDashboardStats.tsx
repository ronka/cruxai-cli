'use client';

import { StatCard } from '@/components/recruiters/StatCard';
import { ClipboardList, PlayCircle, CheckCircle2, Trophy } from 'lucide-react';

interface CandidateDashboardStatsProps {
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
  analyzedCount: number;
}

export function CandidateDashboardStats({
  assignedCount,
  inProgressCount,
  completedCount,
  analyzedCount,
}: CandidateDashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Assigned"
        value={assignedCount}
        icon={ClipboardList}
        description="Total assessments"
      />
      <StatCard
        title="In Progress"
        value={inProgressCount}
        icon={PlayCircle}
        description="Currently working on"
      />
      <StatCard
        title="Completed"
        value={completedCount}
        icon={CheckCircle2}
        description="Submitted & reviewed"
      />
      <StatCard
        title="Analyzed"
        value={analyzedCount}
        icon={Trophy}
        description="With AI analysis"
      />
    </div>
  );
}
