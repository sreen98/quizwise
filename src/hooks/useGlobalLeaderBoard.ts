import { useEffect, useState } from 'react';
import { quizService } from '../service/quizService';
import type { GlobalLeaderboard } from '../service/types';

interface Loaded {
  key: string;
  leaderboard: GlobalLeaderboard | null;
}

export const useGlobalLeaderboard = (limit: number, userId: string) => {
  const key = `${String(limit)}:${userId}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
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

    quizService
      .getGlobalLeaderboard(limit, userId)
      .then(leaderboard => {
        if (current) setLoaded({ key, leaderboard });
      })
      .catch(() => {
        if (current) setLoaded({ key, leaderboard: null });
      });

    return () => {
      current = false;
    };
  }, [key, limit, userId, changes]);

  return { leaderboard: loaded?.leaderboard ?? null, loading: loaded?.key !== key };
};
