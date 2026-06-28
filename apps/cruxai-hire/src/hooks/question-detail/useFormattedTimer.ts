import { useTimerStore } from '@/stores/timerStore';

export function useFormattedTimer(): string {
  const seconds = useTimerStore((state) => state.seconds);
  const limitSeconds = useTimerStore((state) => state.limitSeconds);

  const displaySeconds = limitSeconds !== null
    ? Math.max(0, limitSeconds - seconds)
    : seconds;

  const hours = Math.floor(displaySeconds / 3600);
  const minutes = Math.floor((displaySeconds % 3600) / 60);
  const secs = displaySeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
