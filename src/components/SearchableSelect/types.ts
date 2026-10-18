import type { ReactNode } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  label: string;
  hideLabel?: boolean;
  searchLabel: string;
  nothingFoundMessage: string;
  data: SearchableSelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  renderIcon?: (label: string) => ReactNode;
}
