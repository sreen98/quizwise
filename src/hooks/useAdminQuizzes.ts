import { useEffect, useState } from 'react';
import { downloadJson, jsonFileName } from '../download';
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

  const deleteQuiz = (quizId: string) => quizService.deleteQuiz(quizId);

  const exportQuiz = async (quiz: AdminQuizItem) => {
    downloadJson(jsonFileName(quiz.title), await quizService.exportQuiz(quiz.id));
  };

  const importQuiz = (json: string) => quizService.importQuiz(json);

  return { ...data, deleteQuiz, exportQuiz, importQuiz };
};
