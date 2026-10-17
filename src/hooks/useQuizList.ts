import { useEffect, useState } from 'react';
import { quizService } from '../service/quizService';
import type { QuizListItem } from '../service/types';
import type { Country } from '../types/models';

interface QuizListData {
  key: string;
  quizzes: QuizListItem[];
  countries: Country[];
  userName: string;
  userCountry: string;
  failed: boolean;
}

const EMPTY: QuizListData = { key: '', quizzes: [], countries: [], userName: '', userCountry: '', failed: false };

export const useQuizList = (userId: string, country: string | null) => {
  const key = `${userId}:${country ?? 'own'}`;
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
      quizService.getQuizzes(userId, country ?? undefined),
      quizService.getCountries(),
      quizService.getUsers()
    ])
      .then(([quizzes, countries, users]) => {
        const user = users.find(item => item.id === userId);
        if (current) {
          setData({
            key,
            quizzes,
            countries,
            userName: user?.name ?? '',
            userCountry: user?.country ?? '',
            failed: false
          });
        }
      })
      .catch(() => {
        if (current) setData({ ...EMPTY, key, failed: true });
      });

    return () => {
      current = false;
    };
  }, [key, userId, country, changes]);

  return { ...data, loading: data.key !== key };
};
