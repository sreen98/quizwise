import type { StoreApi } from 'zustand/vanilla';
import { dataStore } from '../data/store';
import type { Attempt, Quiz, QuizData, User } from '../types/models';
import { rankBestAttempts } from './ranking';
import type { Leaderboard, LeaderboardEntry, QuizDetails, QuizListItem } from './types';

const respond = <T>(compute: () => T): Promise<T> =>
  new Promise(resolve => {
    resolve(compute());
  });

const toDetails = (quiz: Quiz): QuizDetails => ({
  id: quiz.id,
  title: quiz.title,
  description: quiz.description,
  countries: quiz.countries,
  questionCount: quiz.questions.length,
  timeLimitSeconds: quiz.timeLimitSeconds,
  perQuestionSeconds: quiz.perQuestionSeconds,
  retakesAllowed: quiz.retakesAllowed
});

const toListItem = (quiz: Quiz, quizAttempts: Attempt[], userId: string): QuizListItem => {
  const userAttempts = quizAttempts.filter(attempt => attempt.userId === userId);
  const [best] = rankBestAttempts(userAttempts);
  const inProgress = userAttempts.find(attempt => attempt.status === 'in_progress');
  const ranked = rankBestAttempts(quizAttempts);
  const rankIndex = ranked.findIndex(attempt => attempt.userId === userId);

  return {
    ...toDetails(quiz),
    completed: Boolean(best),
    bestScore: best?.score ?? null,
    bestPercentage: best?.percentage ?? null,
    bestAttemptId: best?.id ?? null,
    inProgress: inProgress
      ? { attemptId: inProgress.id, answeredCount: inProgress.answers.length, startedAt: inProgress.startedAt }
      : null,
    rank: rankIndex === -1 ? null : rankIndex + 1,
    rankedCount: ranked.length
  };
};

const toLeaderboardEntry = (attempt: Attempt, index: number, users: User[]): LeaderboardEntry => ({
  rank: index + 1,
  userId: attempt.userId,
  userName: users.find(user => user.id === attempt.userId)?.name ?? 'Unknown user',
  score: attempt.score ?? 0,
  totalQuestions: attempt.totalQuestions,
  percentage: attempt.percentage ?? 0,
  timeTakenSeconds: attempt.timeTakenSeconds ?? 0
});

export const createQuizService = (store: StoreApi<QuizData>) => {
  const findQuiz = (quizId: string) => {
    const quiz = store.getState().quizzes.find(item => item.id === quizId);
    if (!quiz) throw new Error('Quiz not found');
    return quiz;
  };

  return {
    getQuizzes: (userId: string, country?: string) =>
      respond(() => {
        const { users, quizzes, attempts } = store.getState();
        const user = users.find(item => item.id === userId);
        if (!user) throw new Error('User not found');

        const countryCode = country ?? user.country;

        return quizzes
          .filter(quiz => countryCode === 'all' || quiz.countries.includes(countryCode))
          .map(quiz =>
            toListItem(
              quiz,
              attempts.filter(attempt => attempt.quizId === quiz.id),
              userId
            )
          );
      }),

    getQuiz: (quizId: string) => respond(() => toDetails(findQuiz(quizId))),

    getLeaderboard: (quizId: string, limit: number, userId: string) =>
      respond((): Leaderboard => {
        const quiz = findQuiz(quizId);
        const { users, attempts } = store.getState();
        const entries = rankBestAttempts(attempts.filter(attempt => attempt.quizId === quiz.id)).map((attempt, index) =>
          toLeaderboardEntry(attempt, index, users)
        );

        return {
          entries: entries.slice(0, limit),
          currentUser: entries.find(entry => entry.userId === userId) ?? null,
          rankedCount: entries.length
        };
      }),

    subscribe: (listener: () => void) => store.subscribe(listener)
  };
};

export const quizService = createQuizService(dataStore);
