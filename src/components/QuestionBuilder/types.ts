import type { UseFormReturnType } from '@mantine/form';
import type { QuizInput } from '../../types/models';

export interface QuestionBuilderProps {
  form: UseFormReturnType<QuizInput>;
}
