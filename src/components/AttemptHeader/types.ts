import type { ReactNode } from 'react';

export interface AttemptHeaderProps {
  quizTitle: string | null;
  timers: ReactNode;
  confirmExit: boolean;
}
