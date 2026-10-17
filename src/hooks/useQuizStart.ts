import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { quizService } from '../service/quizService';
import type { QuizListItem } from '../service/types';
import type { Country } from '../types/models';

type QuizStartState =
  { status: 'loading' } | { status: 'missing' } | { status: 'ready'; quiz: QuizListItem; countries: Country[] };

interface Loaded {
  key: string;
  state: QuizStartState;
}

export const useQuizStart = (quizId: string, userId: string) => {
  const key = `${quizId}:${userId}`;
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [starting, setStarting] = useState(false);
  const [hasStartFailed, setHasStartFailed] = useState(false);

  useEffect(() => {
    let current = true;

    Promise.all([quizService.getQuizSummary(quizId, userId), quizService.getCountries()])
      .then(([quiz, countries]) => {
        if (current) setLoaded({ key, state: { status: 'ready', quiz, countries } });
      })
      .catch(() => {
        if (current) setLoaded({ key, state: { status: 'missing' } });
      });

    return () => {
      current = false;
    };
  }, [key, quizId, userId]);

  const start = async () => {
    setStarting(true);
    setHasStartFailed(false);
    try {
      const { attemptId } = await quizService.startOrResumeAttempt(quizId, userId);
      await navigate(`/attempts/${attemptId}`);
    } catch {
      setHasStartFailed(true);
      setStarting(false);
    }
  };

  const state: QuizStartState = loaded?.key === key ? loaded.state : { status: 'loading' };

  return { state, start, starting, hasStartFailed };
};
