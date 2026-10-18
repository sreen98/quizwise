import type { Country } from '../../types/models';

export interface CountryFilterProps {
  countries: Country[];
  value: string[];
  onChange: (value: string[]) => void;
}
