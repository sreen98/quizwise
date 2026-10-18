import { useEffect, useState } from 'react';
import { quizService } from '../service/quizService';
import type { Leaderboard, QuizListItem } from '../service/types';

interface LeaderboardData {
  key: string;
  quizzes: QuizListItem[];
  leaderboard: Leaderboard | null;
}

const EMPTY: LeaderboardData = { key: '', quizzes: [], leaderboard: null };

export const useLeaderboard = (quizId: string, limit: number, userId: string) => {
  const key = `${quizId}:${String(limit)}:${userId}`;
  const [data, setData] = useState(EMPTY);
  const [changes, setChanges] = useState(0);

  useEffect(
    () =>
      quizService.subscribe(() => {
        setChanges(count => count + 1);
      }),
    []
  );

  useEffect(() => {
    let current = true;

    Promise.all([
      quizService.getQuizzes(userId, []),
      quizId ? quizService.getLeaderboard(quizId, limit, userId).catch(() => null) : null
    ])
      .then(([quizzes, leaderboard]) => {
        if (current) setData({ key, quizzes, leaderboard });
      })
      .catch(() => {
        if (current) setData({ ...EMPTY, key });
      });

    return () => {
      current = false;
    };
  }, [key, quizId, limit, userId, changes]);

  return { ...data, loading: data.key !== key };
};
