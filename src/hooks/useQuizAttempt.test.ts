import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setSlowNetwork } from '../service/latency';
import { quizService } from '../service/quizService';
import { useQuizAttempt } from './useQuizAttempt';

const startAttempt = async (quizId: string) => (await quizService.startOrResumeAttempt(quizId, 'u5')).attemptId;

const renderAttempt = async (attemptId: string) => {
  const hook = renderHook(() => useQuizAttempt(attemptId));
  await waitFor(() => {
    expect(hook.result.current.state.status).not.toBe('loading');
  });
  return hook;
};

const inProgress = (state: ReturnType<typeof useQuizAttempt>['state']) => {
  if (state.status !== 'in_progress') throw new Error(`Expected a question, got ${state.status}`);
  return state;
};

describe('useQuizAttempt', () => {
  beforeEach(async () => {
    setSlowNetwork(false);
    await quizService.resetData();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads the first question without the correct answers', async () => {
    const { result } = await renderAttempt(await startAttempt('q1'));
    const current = inProgress(result.current.state);

    expect(current).toMatchObject({ index: 0, total: 6, timeLimitSeconds: 300, perQuestionSeconds: null });
    expect(current.question).not.toHaveProperty('correctOptionIds');
    expect(result.current.selection).toEqual([]);
  });

  it('keeps the selected option after a reload', async () => {
    const attemptId = await startAttempt('q1');
    const first = await renderAttempt(attemptId);

    await act(async () => {
      first.result.current.select(['q1-1-o2']);
      await Promise.resolve();
    });
    first.unmount();
    const second = await renderAttempt(attemptId);

    expect(second.result.current.selection).toEqual(['q1-1-o2']);
  });

  it('moves to the next question after submitting', async () => {
    const { result } = await renderAttempt(await startAttempt('q1'));

    act(() => {
      result.current.select(['q1-1-o3']);
    });
    act(() => {
      result.current.submit();
    });

    await waitFor(() => {
      expect(inProgress(result.current.state).index).toBe(1);
    });
    expect(result.current.selection).toEqual([]);
  });

  it('sends only one answer when submit is pressed twice quickly', async () => {
    const submitAnswer = vi.spyOn(quizService, 'submitAnswer');
    const { result } = await renderAttempt(await startAttempt('q1'));

    act(() => {
      result.current.submit();
      result.current.submit();
    });

    await waitFor(() => {
      expect(inProgress(result.current.state).index).toBe(1);
    });
    expect(submitAnswer).toHaveBeenCalledTimes(1);
    submitAnswer.mockRestore();
  });

  it('submits the selected option and moves on when the question time runs out', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const attemptId = await startAttempt('q2');
    const { result } = await renderAttempt(attemptId);
    const firstQuestion = (await quizService.getQuizForEdit('q2')).questions[0];

    await act(async () => {
      result.current.select(firstQuestion?.correctOptionIds ?? []);
      await Promise.resolve();
    });
    act(() => {
      vi.advanceTimersByTime(30_500);
    });

    await waitFor(() => {
      expect(inProgress(result.current.state).index).toBe(1);
    });
    expect((await quizService.completeAttempt(attemptId)).correctCount).toBe(1);
  });

  it('resumes at the same question with the same deadline after a reload', async () => {
    const attemptId = await startAttempt('q1');
    const first = await renderAttempt(attemptId);
    const deadline = inProgress(first.result.current.state).deadlineAt;
    first.unmount();

    const second = await renderAttempt(attemptId);

    expect(inProgress(second.result.current.state)).toMatchObject({ index: 0, deadlineAt: deadline });
  });

  it('shows that time ran out for an attempt that expired while away', async () => {
    const { result } = await renderAttempt('a11');

    expect(result.current.state).toEqual({ status: 'completed', endReason: 'timeout' });
  });

  it('reports a quiz that was edited during the attempt', async () => {
    const { result } = await renderAttempt(await startAttempt('q1'));
    const quiz = await quizService.getQuizForEdit('q1');
    await quizService.updateQuiz('q1', { ...quiz, title: 'JavaScript Basics, revised' });

    act(() => {
      result.current.submit();
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({ status: 'closed', endReason: 'quiz_changed' });
    });
  });

  it('reports an attempt that does not exist', async () => {
    const { result } = await renderAttempt('nope');

    expect(result.current.state).toEqual({ status: 'missing' });
  });
});
