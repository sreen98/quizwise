import { useEffect, useRef, useState } from 'react';
import { quizService } from '../service/quizService';
import type { CurrentQuestion, QuestionInProgress } from '../service/types';
import { useCountdown } from './useCountdown';

type AttemptState = { status: 'loading' } | { status: 'missing' } | CurrentQuestion;

interface Loaded {
  key: string;
  state: AttemptState;
  hasSeenQuestion: boolean;
}

const nextLoaded =
  (key: string, state: AttemptState) =>
  (previous: Loaded | null): Loaded => ({
    key,
    state,
    hasSeenQuestion: state.status === 'in_progress' || (previous?.key === key && previous.hasSeenQuestion)
  });

const limitFor = (question: QuestionInProgress) =>
  question.deadlineAt !== null && question.deadlineAt === question.questionDeadlineAt
    ? question.perQuestionSeconds
    : question.timeLimitSeconds;

export const useQuizAttempt = (attemptId: string, userId: string) => {
  const key = `${attemptId}:${userId}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const submittingRef = useRef(false);
  const latestRequest = useRef(0);

  const state: AttemptState = loaded?.key === key ? loaded.state : { status: 'loading' };
  const question = state.status === 'in_progress' ? state : null;
  const isEndedWhileAway = loaded?.key === key && !loaded.hasSeenQuestion;

  useEffect(() => {
    const request = ++latestRequest.current;

    quizService
      .getCurrentQuestion(attemptId, userId)
      .then(current => {
        if (request !== latestRequest.current) return;
        setLoaded(nextLoaded(key, current));
        setSelection(current.status === 'in_progress' ? current.draftOptionIds : []);
      })
      .catch(() => {
        if (request === latestRequest.current) setLoaded(nextLoaded(key, { status: 'missing' }));
      });
  }, [key, attemptId, userId, reloadKey]);

  const { now, remainingMs, announcement } = useCountdown({
    deadlineAt: question?.deadlineAt ?? null,
    limitSeconds: question ? limitFor(question) : null,
    onExpire: () => {
      setReloadKey(count => count + 1);
    }
  });

  const select = (optionIds: string[]) => {
    if (!question || submittingRef.current) return;
    setSelection(optionIds);
    void quizService.saveDraft(attemptId, question.question.id, optionIds, userId).catch(() => undefined);
  };

  const submit = () => {
    if (!question || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const request = ++latestRequest.current;

    quizService
      .submitAnswer(attemptId, question.question.id, selection, userId)
      .then(current => {
        if (request !== latestRequest.current) return;
        setLoaded(nextLoaded(key, current));
        setSelection(current.status === 'in_progress' ? current.draftOptionIds : []);
      })
      .catch(() => {
        setReloadKey(count => count + 1);
      })
      .finally(() => {
        submittingRef.current = false;
        setSubmitting(false);
      });
  };

  return { state, isEndedWhileAway, selection, select, submit, submitting, now, remainingMs, announcement };
};
