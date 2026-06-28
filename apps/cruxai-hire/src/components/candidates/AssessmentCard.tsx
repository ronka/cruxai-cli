'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CandidateAssessment, AssessmentStatus } from '@/types/candidate';
import { Clock, Building2, Briefcase, ArrowRight, Play, Eye } from 'lucide-react';

const statusConfig: Record<AssessmentStatus, { label: string; className: string }> = {
  not_started: {
    label: 'Not Started',
    className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  reviewed: {
    label: 'Reviewed',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400',
  },
};

interface AssessmentCardProps {
  assessment: CandidateAssessment;
}

function formatTimeLimit(timeLimit: CandidateAssessment['timeLimit']): string {
  const { value, unit } = timeLimit;
  if (unit === 'minutes') {
    return value >= 60 ? `${value / 60}h` : `${value}m`;
  }
  return `${value}h`;
}

export function AssessmentCard({ assessment }: AssessmentCardProps) {
  const status = statusConfig[assessment.status];
  const assignedDate = new Date(assessment.assignedAt).toLocaleDateString();

  const getActionButton = () => {
    switch (assessment.status) {
      case 'not_started':
        return (
          <Button size="sm" asChild>
            <Link href={`/questions/${assessment.questionId}`}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Start
            </Link>
          </Button>
        );
      case 'in_progress':
        return (
          <Button size="sm" asChild>
            <Link href={`/questions/${assessment.questionId}`}>
              <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
              Continue
            </Link>
          </Button>
        );
      case 'submitted':
      case 'reviewed':
        return (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/questions/${assessment.questionId}`}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              View Results
            </Link>
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{assessment.questionTitle}</h3>
              <Badge className={status.className} variant="secondary">
                {status.label}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{assessment.roleTitle}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{assessment.companyName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{formatTimeLimit(assessment.timeLimit)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Assigned on {assignedDate}</p>
            {assessment.status === 'reviewed' && assessment.hasAnalysis && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">Analysis available</span>
              </div>
            )}
          </div>
          <div className="shrink-0">{getActionButton()}</div>
        </div>
      </CardContent>
    </Card>
  );
}
