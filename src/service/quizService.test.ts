import { beforeEach, describe, expect, it } from 'vitest';
import { createDataStore } from '../data/store';
import type { Attempt } from '../types/models';
import { createQuizService } from './quizService';

const setup = () => {
  localStorage.clear();
  const store = createDataStore();
  return { store, service: createQuizService(store) };
};

const ids = (items: { id: string }[]) => items.map(item => item.id);

describe('getQuizzes', () => {
  let context: ReturnType<typeof setup>;

  beforeEach(() => {
    context = setup();
  });

  it("shows the quizzes for the user's own country by default", async () => {
    expect(ids(await context.service.getQuizzes('u1'))).toEqual(['q1', 'q2', 'q3', 'q4']);
  });

  it('hides quizzes that are not assigned to the country', async () => {
    const quizzes = await context.service.getQuizzes('u2');

    expect(ids(quizzes)).toEqual(['q1', 'q3', 'q5']);
  });

  it('shows every quiz for all countries', async () => {
    expect(ids(await context.service.getQuizzes('u2', 'all'))).toEqual(['q1', 'q2', 'q3', 'q4', 'q5']);
  });

  it('filters by a chosen country', async () => {
    expect(ids(await context.service.getQuizzes('u1', 'GB'))).toEqual(['q1', 'q2', 'q3', 'q5']);
  });

  it('marks a completed quiz with the best score', async () => {
    const quiz = (await context.service.getQuizzes('u1')).find(item => item.id === 'q1');

    expect(quiz).toMatchObject({
      completed: true,
      questionCount: 6,
      bestScore: 5,
      bestPercentage: 83.3,
      bestAttemptId: 'a1',
      inProgress: null
    });
  });

  it('shows the in progress attempt with how many questions are answered', async () => {
    const quiz = (await context.service.getQuizzes('u1')).find(item => item.id === 'q3');

    expect(quiz).toMatchObject({
      completed: false,
      bestScore: null,
      inProgress: { attemptId: 'a11', answeredCount: 2, startedAt: '2026-10-16T09:00:00Z' }
    });
  });

  it('shows every quiz as not started for a user without attempts', async () => {
    const quizzes = await context.service.getQuizzes('u5');

    expect(quizzes.every(quiz => !quiz.completed && quiz.inProgress === null)).toBe(true);
  });

  it('picks the faster attempt as best when two scores tie', async () => {
    const { store, service } = context;
    const original = store.getState().attempts.find(attempt => attempt.id === 'a4');
    if (!original) throw new Error('Seed attempt a4 is missing');
    const faster: Attempt = { ...original, id: 'a4-faster', timeTakenSeconds: 100 };
    const lowerButFaster: Attempt = { ...original, id: 'a4-lower', score: 4, percentage: 66.7, timeTakenSeconds: 50 };
    store.setState({ attempts: [...store.getState().attempts, lowerButFaster, faster] });

    const quiz = (await service.getQuizzes('u4')).find(item => item.id === 'q1');

    expect(quiz?.bestAttemptId).toBe('a4-faster');
  });

  it('ignores attempts closed because the quiz changed', async () => {
    const { store, service } = context;
    store.setState({
      attempts: store
        .getState()
        .attempts.map(attempt =>
          attempt.id === 'a1' ? { ...attempt, status: 'closed' as const, endReason: 'quiz_changed' as const } : attempt
        )
    });

    const quiz = (await service.getQuizzes('u1')).find(item => item.id === 'q1');

    expect(quiz).toMatchObject({ completed: false, bestScore: null });
  });

  it('rejects an unknown user', async () => {
    await expect(context.service.getQuizzes('nobody')).rejects.toThrow('User not found');
  });
});
