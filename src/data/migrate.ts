import type { QuizData } from '../types/models';
import { parseQuizData } from './schema';

export const migrateSeed = (json: unknown): QuizData => {
  const data = parseQuizData(json);

  return {
    ...data,
    attempts: data.attempts.map(attempt =>
      attempt.status === 'completed' && !attempt.endReason ? { ...attempt, endReason: 'submitted' } : attempt
    )
  };
};
