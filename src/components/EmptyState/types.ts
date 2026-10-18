import type { ReactNode } from 'react';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action: ReactNode;
}
