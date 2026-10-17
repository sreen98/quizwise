import type { PublicQuestion } from '../../types/models';

export interface QuestionViewProps {
  question: PublicQuestion;
  value: string[];
  onChange: (optionIds: string[]) => void;
  disabled: boolean;
}
