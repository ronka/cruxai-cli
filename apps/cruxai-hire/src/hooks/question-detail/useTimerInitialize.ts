import { useEffect } from 'react';
import { useTimerStore } from '@/stores/timerStore';
import type { TimeConstraints } from '@/types/question-shared';

function toSeconds(constraints: TimeConstraints): number {
  return constraints.unit === 'hours'
    ? constraints.limit * 3600
    : constraints.limit * 60;
}

export function useTimerInitialize(timeConstraints: TimeConstraints | undefined) {
  const initialize = useTimerStore((state) => state.initialize);

  useEffect(() => {
    if (!timeConstraints) return;
    initialize(toSeconds(timeConstraints), timeConstraints.hardStop);
  }, [timeConstraints, initialize]);
}
