import type { Option, QuestionType } from '../../types/models';

export interface OptionListProps {
  type: QuestionType;
  options: Option[];
  value: string[];
  onChange: (optionIds: string[]) => void;
  disabled: boolean;
}
