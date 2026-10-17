import { useEffect, useState } from 'react';
import { quizService } from '../service/quizService';
import type { AttemptResultView } from '../service/types';

type AttemptResultState = { status: 'loading' } | { status: 'missing' } | AttemptResultView;

interface Loaded {
  key: string;
  state: AttemptResultState;
}

export const useAttemptResult = (attemptId: string, userId: string): AttemptResultState => {
  const key = `${attemptId}:${userId}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let current = true;

    quizService
      .getAttemptResult(attemptId, userId)
      .then(result => {
        if (current) setLoaded({ key, state: result });
      })
      .catch(() => {
        if (current) setLoaded({ key, state: { status: 'missing' } });
      });

    return () => {
      current = false;
    };
  }, [key, attemptId, userId]);

  return loaded?.key === key ? loaded.state : { status: 'loading' };
};
