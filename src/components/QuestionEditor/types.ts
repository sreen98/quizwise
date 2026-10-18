import type { UseFormReturnType } from '@mantine/form';
import type { ReactNode } from 'react';
import type { Question, QuizInput } from '../../types/models';

export interface QuestionEditorProps {
  form: UseFormReturnType<QuizInput>;
  question: Question;
  index: number;
  onClose: () => void;
  handle: ReactNode;
}
