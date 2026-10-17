import { useEffect, useState } from 'react';
import { quizService } from '../service/quizService';
import type { AdminQuizItem } from '../service/types';

interface AdminQuizzesData {
  quizzes: AdminQuizItem[];
  loading: boolean;
  hasFailed: boolean;
}

export const useAdminQuizzes = () => {
  const [data, setData] = useState<AdminQuizzesData>({ quizzes: [], loading: true, hasFailed: false });
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
      .getAdminQuizzes()
      .then(quizzes => {
        if (current) setData({ quizzes, loading: false, hasFailed: false });
      })
      .catch(() => {
        if (current) setData({ quizzes: [], loading: false, hasFailed: true });
      });

    return () => {
      current = false;
    };
  }, [changes]);

  return data;
};
