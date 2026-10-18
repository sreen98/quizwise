import type { ReactNode } from 'react';

export interface ChipOption {
  value: string;
  label: string;
}

export interface ChipMultiSelectProps {
  label: string;
  placeholder: string;
  nothingFoundMessage: string;
  data: ChipOption[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
}
