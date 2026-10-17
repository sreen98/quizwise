import { useEffect, useState } from 'react';
import { quizService } from '../service/quizService';
import type { Country, QuizInput } from '../types/models';

type QuizEditorState =
  { status: 'loading' } | { status: 'missing' } | { status: 'ready'; quiz: QuizInput; countries: Country[] };

interface Loaded {
  key: string;
  state: QuizEditorState;
}

const emptyQuiz: QuizInput = {
  title: '',
  description: '',
  countries: [],
  timeLimitSeconds: null,
  perQuestionSeconds: null,
  retakesAllowed: true,
  questions: []
};

export const useQuizEditor = (quizId: string | undefined) => {
  const key = quizId ?? 'new';
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let current = true;

    Promise.all([quizId ? quizService.getQuizForEdit(quizId) : emptyQuiz, quizService.getCountries()])
      .then(([quiz, countries]) => {
        const { title, description, timeLimitSeconds, perQuestionSeconds, retakesAllowed, questions } = quiz;
        const input = {
          title,
          description,
          countries: quiz.countries,
          timeLimitSeconds,
          perQuestionSeconds,
          retakesAllowed,
          questions
        };
        if (current) setLoaded({ key, state: { status: 'ready', quiz: input, countries } });
      })
      .catch(() => {
        if (current) setLoaded({ key, state: { status: 'missing' } });
      });

    return () => {
      current = false;
    };
  }, [key, quizId]);

  const save = async (values: QuizInput) => {
    if (quizId) await quizService.updateQuiz(quizId, values);
    else await quizService.createQuiz(values);
  };

  const state: QuizEditorState = loaded?.key === key ? loaded.state : { status: 'loading' };

  return { state, save };
};
