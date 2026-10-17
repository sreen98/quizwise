import { useEffect, useRef, useState } from 'react';
import { quizService } from '../service/quizService';
import type { CurrentQuestion, QuestionInProgress } from '../service/types';
import { useCountdown } from './useCountdown';

type AttemptState = { status: 'loading' } | { status: 'missing' } | CurrentQuestion;

interface Loaded {
  attemptId: string;
  state: AttemptState;
  sawQuestion: boolean;
}

const nextLoaded =
  (attemptId: string, state: AttemptState) =>
  (previous: Loaded | null): Loaded => ({
    attemptId,
    state,
    sawQuestion: state.status === 'in_progress' || (previous?.attemptId === attemptId && previous.sawQuestion)
  });

const limitFor = (question: QuestionInProgress) =>
  question.deadlineAt !== null && question.deadlineAt === question.questionDeadlineAt
    ? question.perQuestionSeconds
    : question.timeLimitSeconds;

export const useQuizAttempt = (attemptId: string) => {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const submittingRef = useRef(false);
  const latestRequest = useRef(0);

  const state: AttemptState = loaded?.attemptId === attemptId ? loaded.state : { status: 'loading' };
  const question = state.status === 'in_progress' ? state : null;
  const endedWhileAway = loaded?.attemptId === attemptId && !loaded.sawQuestion;

  useEffect(() => {
    const request = ++latestRequest.current;

    quizService
      .getCurrentQuestion(attemptId)
      .then(current => {
        if (request !== latestRequest.current) return;
        setLoaded(nextLoaded(attemptId, current));
        setSelection(current.status === 'in_progress' ? current.draftOptionIds : []);
      })
      .catch(() => {
        if (request === latestRequest.current) setLoaded(nextLoaded(attemptId, { status: 'missing' }));
      });
  }, [attemptId, reloadKey]);

  const { now, remainingMs, announcement } = useCountdown({
    deadlineAt: question?.deadlineAt ?? null,
    limitSeconds: question ? limitFor(question) : null,
    onExpire: () => {
      setReloadKey(key => key + 1);
    }
  });

  const select = (optionIds: string[]) => {
    if (!question) return;
    setSelection(optionIds);
    void quizService.saveDraft(attemptId, question.question.id, optionIds).catch(() => undefined);
  };

  const submit = () => {
    if (!question || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const request = ++latestRequest.current;

    quizService
      .submitAnswer(attemptId, question.question.id, selection)
      .then(current => {
        if (request !== latestRequest.current) return;
        setLoaded(nextLoaded(attemptId, current));
        setSelection(current.status === 'in_progress' ? current.draftOptionIds : []);
      })
      .catch(() => {
        setReloadKey(key => key + 1);
      })
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
  };

  return { state, endedWhileAway, selection, select, submit, submitting, now, remainingMs, announcement };
};
