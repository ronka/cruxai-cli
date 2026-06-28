'use client';

import { AssessmentCard } from './AssessmentCard';
import type { CandidateAssessment } from '@/types/candidate';

interface AssessmentsListProps {
  assessments: CandidateAssessment[];
  emptyMessage?: string;
}

export function AssessmentsList({
  assessments,
  emptyMessage = 'No assessments found.',
}: AssessmentsListProps) {
  if (assessments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assessments.map((assessment) => (
        <AssessmentCard key={assessment.id} assessment={assessment} />
      ))}
    </div>
  );
}
