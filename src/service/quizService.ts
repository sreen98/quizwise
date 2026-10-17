import type { StoreApi } from 'zustand/vanilla';
import { dataStore } from '../data/store';
import type { Attempt, Quiz, QuizData } from '../types/models';
import type { QuizListItem } from './types';

const respond = <T>(compute: () => T): Promise<T> =>
  new Promise(resolve => {
    resolve(compute());
  });

const byBestResult = (a: Attempt, b: Attempt) =>
  (b.score ?? 0) - (a.score ?? 0) || (a.timeTakenSeconds ?? 0) - (b.timeTakenSeconds ?? 0);

const toListItem = (quiz: Quiz, attempts: Attempt[]): QuizListItem => {
  const [best] = attempts.filter(attempt => attempt.status === 'completed').sort(byBestResult);
  const inProgress = attempts.find(attempt => attempt.status === 'in_progress');

  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    countries: quiz.countries,
    questionCount: quiz.questions.length,
    timeLimitSeconds: quiz.timeLimitSeconds,
    perQuestionSeconds: quiz.perQuestionSeconds,
    retakesAllowed: quiz.retakesAllowed,
    completed: Boolean(best),
    bestScore: best?.score ?? null,
    bestPercentage: best?.percentage ?? null,
    bestAttemptId: best?.id ?? null,
    inProgress: inProgress
      ? { attemptId: inProgress.id, answeredCount: inProgress.answers.length, startedAt: inProgress.startedAt }
      : null
  };
};

export const createQuizService = (store: StoreApi<QuizData>) => ({
  getQuizzes: (userId: string, country?: string) =>
    respond(() => {
      const { users, quizzes, attempts } = store.getState();
      const user = users.find(item => item.id === userId);
      if (!user) throw new Error('User not found');

      const countryCode = country ?? user.country;
      const userAttempts = attempts.filter(attempt => attempt.userId === userId);

      return quizzes
        .filter(quiz => countryCode === 'all' || quiz.countries.includes(countryCode))
        .map(quiz =>
          toListItem(
            quiz,
            userAttempts.filter(attempt => attempt.quizId === quiz.id)
          )
        );
    })
});

export const quizService = createQuizService(dataStore);
