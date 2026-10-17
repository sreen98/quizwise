import type { Country, QuizInput } from '../../types/models';

export interface QuizFormProps {
  initialValues: QuizInput;
  countries: Country[];
  isNew: boolean;
  onSubmit: (values: QuizInput) => Promise<void>;
}
