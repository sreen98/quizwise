import type { Attempt, Quiz } from '../types/models';

export interface Deadlines {
  overallDeadlineAt: number | null;
  questionDeadlineAt: number | null;
  deadlineAt: number | null;
}

type AttemptTimes = Pick<Attempt, 'startedAt' | 'answers'>;
type QuizLimits = Pick<Quiz, 'timeLimitSeconds' | 'perQuestionSeconds'>;

export const questionStartedAt = (attempt: AttemptTimes): number =>
  Date.parse(attempt.answers.at(-1)?.answeredAt ?? attempt.startedAt);

export const getDeadlines = (quiz: QuizLimits, attempt: AttemptTimes): Deadlines => {
  const overallDeadlineAt =
    quiz.timeLimitSeconds === null ? null : Date.parse(attempt.startedAt) + quiz.timeLimitSeconds * 1000;
  const questionDeadlineAt =
    quiz.perQuestionSeconds === null ? null : questionStartedAt(attempt) + quiz.perQuestionSeconds * 1000;
  const limits = [overallDeadlineAt, questionDeadlineAt].filter(deadline => deadline !== null);

  return {
    overallDeadlineAt,
    questionDeadlineAt,
    deadlineAt: limits.length > 0 ? Math.min(...limits) : null
  };
};
