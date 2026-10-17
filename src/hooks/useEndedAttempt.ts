import { useEffect, useState } from 'react';
import { quizService } from '../service/quizService';
import type { EndedAttempt } from '../service/types';

type EndedAttemptState = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; attempt: EndedAttempt };

interface Loaded {
  attemptId: string;
  state: EndedAttemptState;
}

export const useEndedAttempt = (attemptId: string): EndedAttemptState => {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let current = true;

    quizService
      .getEndedAttempt(attemptId)
      .then(attempt => {
        if (current) setLoaded({ attemptId, state: { status: 'ready', attempt } });
      })
      .catch(() => {
        if (current) setLoaded({ attemptId, state: { status: 'missing' } });
      });

    return () => {
      current = false;
    };
  }, [attemptId]);

  return loaded?.attemptId === attemptId ? loaded.state : { status: 'loading' };
};
