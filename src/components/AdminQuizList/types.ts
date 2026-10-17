import type { AdminQuizItem } from '../../service/types';

export interface AdminQuizListProps {
  quizzes: AdminQuizItem[];
  onDelete: (quiz: AdminQuizItem) => void;
}
