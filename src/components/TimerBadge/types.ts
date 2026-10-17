export type TimerScope = 'quiz' | 'question';

export interface TimerBadgeProps {
  scope: TimerScope;
  remainingMs: number;
  limitSeconds: number;
  showShortLabel: boolean;
}
