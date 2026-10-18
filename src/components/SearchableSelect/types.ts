export interface SearchableSelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  label: string;
  searchLabel: string;
  nothingFoundMessage: string;
  data: SearchableSelectOption[];
  value: string | null;
  onChange: (value: string) => void;
}
