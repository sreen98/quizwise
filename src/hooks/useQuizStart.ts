import { useEffect, useState } from 'react';
import { quizService } from '../service/quizService';
import type { QuizListItem } from '../service/types';
import type { Country } from '../types/models';

type QuizStartState =
  { status: 'loading' } | { status: 'missing' } | { status: 'ready'; quiz: QuizListItem; countries: Country[] };

interface Loaded {
  key: string;
  state: QuizStartState;
}

export const useQuizStart = (quizId: string, userId: string): QuizStartState => {
  const key = `${quizId}:${userId}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

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

  return loaded?.key === key ? loaded.state : { status: 'loading' };
};
