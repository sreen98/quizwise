import type { QuizListItem } from '../../service/types';
import type { Country } from '../../types/models';

export interface QuizCardProps {
  quiz: QuizListItem;
  countries: Country[];
}
