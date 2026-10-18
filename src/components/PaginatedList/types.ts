import type { ReactNode } from 'react';

export interface PaginatedListProps<T> {
  items: T[];
  page: number;
  pageSize: number;
  itemName: string;
  itemsName: string;
  onPageChange: (page: number) => void;
  children: (shown: T[]) => ReactNode;
}
