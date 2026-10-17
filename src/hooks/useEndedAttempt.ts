import { useEffect, useState } from 'react';
import { quizService } from '../service/quizService';
import type { EndedAttempt } from '../service/types';

type EndedAttemptState = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; attempt: EndedAttempt };

interface Loaded {
  key: string;
  state: EndedAttemptState;
}

export const useEndedAttempt = (attemptId: string, userId: string): EndedAttemptState => {
  const key = `${attemptId}:${userId}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let current = true;

    quizService
      .getEndedAttempt(attemptId, userId)
      .then(attempt => {
        if (current) setLoaded({ key, state: { status: 'ready', attempt } });
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
