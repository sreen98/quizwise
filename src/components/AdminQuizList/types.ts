import type { AdminQuizItem } from '../../service/types';

export interface AdminQuizListProps {
  quizzes: AdminQuizItem[];
  onExport: (quiz: AdminQuizItem) => void;
  onDelete: (quiz: AdminQuizItem) => void;
}
