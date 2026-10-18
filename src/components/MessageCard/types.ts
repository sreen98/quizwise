import type { ReactNode } from 'react';

export interface MessageCardProps {
  icon: ReactNode;
  color?: 'blue' | 'orange';
  badge?: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
}
