import type { ReactNode } from 'react';

export interface SortableQuestionProps {
  id: string;
  number: number;
  children: (handle: ReactNode) => ReactNode;
}
