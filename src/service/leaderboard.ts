import type { Attempt, QuizData } from '../types/models';
import { rankBestAttempts } from './ranking';
import type { GlobalLeaderboardEntry, LeaderboardEntry } from './types';

interface Totals {
  totalScore: number;
  quizzesCompleted: number;
  totalTimeSeconds: number;
}

const userDetails = (userId: string, { users, countries }: QuizData) => {
  const user = users.find(item => item.id === userId);

  return {
    userId,
    userName: user?.name ?? 'Unknown user',
    country: user?.country ?? '',
    countryName: countries.find(country => country.code === user?.country)?.name ?? ''
  };
};

export const toLeaderboardEntry = (attempt: Attempt, index: number, data: QuizData): LeaderboardEntry => ({
  rank: index + 1,
  ...userDetails(attempt.userId, data),
  score: attempt.score ?? 0,
  totalQuestions: attempt.totalQuestions,
  percentage: attempt.percentage ?? 0,
  timeTakenSeconds: attempt.timeTakenSeconds ?? 0,
  completedAt: attempt.completedAt
});

export const rankUsersGlobally = (data: QuizData): GlobalLeaderboardEntry[] => {
  const totals = new Map<string, Totals>();

  for (const quiz of data.quizzes) {
    for (const best of rankBestAttempts(data.attempts.filter(attempt => attempt.quizId === quiz.id))) {
      const total = totals.get(best.userId) ?? { totalScore: 0, quizzesCompleted: 0, totalTimeSeconds: 0 };
      totals.set(best.userId, {
        totalScore: total.totalScore + (best.score ?? 0),
        quizzesCompleted: total.quizzesCompleted + 1,
        totalTimeSeconds: total.totalTimeSeconds + (best.timeTakenSeconds ?? 0)
      });
    }
  }

  return [...totals]
    .map(([userId, total]) => ({ ...userDetails(userId, data), ...total }))
    .sort(
      (a, b) =>
        b.totalScore - a.totalScore || a.totalTimeSeconds - b.totalTimeSeconds || a.userName.localeCompare(b.userName)
    )
    .map((entry, index) => ({ rank: index + 1, ...entry }));
};
