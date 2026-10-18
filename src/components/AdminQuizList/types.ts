import type { AdminQuizItem } from '../../service/types';
import type { Country } from '../../types/models';

export interface AdminQuizListProps {
  quizzes: AdminQuizItem[];
  countries: Country[];
  onExport: (quiz: AdminQuizItem) => void;
  onDelete: (quiz: AdminQuizItem) => void;
}
