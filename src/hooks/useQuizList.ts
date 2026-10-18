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
  hasFailed: boolean;
}

const EMPTY: QuizListData = { key: '', quizzes: [], countries: [], userName: '', userCountry: '', hasFailed: false };

export const useQuizList = (userId: string, countryFilter: string[] | null) => {
  const key = `${userId}:${countryFilter?.join(',') ?? 'own'}`;
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
      quizService.getQuizzes(userId, countryFilter ?? undefined),
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
            hasFailed: false
          });
        }
      })
      .catch(() => {
        if (current) setData({ ...EMPTY, key, hasFailed: true });
      });

    return () => {
      current = false;
    };
  }, [key, userId, countryFilter, changes]);

  return { ...data, loading: data.key !== key };
};
