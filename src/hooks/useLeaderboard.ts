import { useEffect, useState } from 'react';
import { quizService } from '../service/quizService';
import type { Leaderboard, QuizListItem } from '../service/types';

interface LeaderboardData {
  keys: string[];
  quizId: string;
  quizzes: QuizListItem[];
  leaderboard: Leaderboard | null;
}

const EMPTY: LeaderboardData = { keys: [], quizId: '', quizzes: [], leaderboard: null };

const keyFor = (quizId: string, limit: number, userId: string) => `${quizId}:${String(limit)}:${userId}`;

export const useLeaderboard = (quizId: string, limit: number, userId: string) => {
  const key = keyFor(quizId, limit, userId);
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

    const loadBoard = (id: string) => (id ? quizService.getLeaderboard(id, limit, userId).catch(() => null) : null);

    const load = async () => {
      if (quizId) {
        const [quizzes, leaderboard] = await Promise.all([quizService.getQuizzes(userId, []), loadBoard(quizId)]);
        return { keys: [key], quizId, quizzes, leaderboard };
      }
      const quizzes = await quizService.getQuizzes(userId, []);
      const firstQuizId = quizzes[0]?.id ?? '';
      const leaderboard = await loadBoard(firstQuizId);
      return {
        keys: [key, keyFor(firstQuizId, limit, userId)],
        quizId: firstQuizId,
        quizzes,
        leaderboard
      };
    };

    load()
      .then(result => {
        if (current) setData(result);
      })
      .catch(() => {
        if (current) setData({ ...EMPTY, keys: [key] });
      });

    return () => {
      current = false;
    };
  }, [key, quizId, limit, userId, changes]);

  return { ...data, loading: !data.keys.includes(key) };
};
