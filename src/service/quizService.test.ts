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

  it("shows the user's leaderboard rank on each quiz", async () => {
    const quizzes = await context.service.getQuizzes('u1');

    expect(quizzes.find(quiz => quiz.id === 'q1')).toMatchObject({ rank: 3, rankedCount: 4 });
    expect(quizzes.find(quiz => quiz.id === 'q3')).toMatchObject({ rank: null, rankedCount: 2 });
  });
});

describe('getQuiz', () => {
  it('returns the quiz details without the questions', async () => {
    const quiz = await setup().service.getQuiz('q2');

    expect(quiz).toEqual({
      id: 'q2',
      title: 'React Fundamentals',
      description: expect.any(String) as string,
      countries: ['IN', 'GB'],
      questionCount: 7,
      timeLimitSeconds: null,
      perQuestionSeconds: 30,
      retakesAllowed: false
    });
    expect(quiz).not.toHaveProperty('questions');
  });

  it('rejects an unknown quiz', async () => {
    await expect(setup().service.getQuiz('q99')).rejects.toThrow('Quiz not found');
  });
});

describe('getLeaderboard', () => {
  it('orders by score and breaks ties by the faster time', async () => {
    const { entries } = await setup().service.getLeaderboard('q1', 10, 'u1');

    expect(entries.map(entry => [entry.rank, entry.userName, entry.score, entry.timeTakenSeconds])).toEqual([
      [1, 'Fatima Al Mansoori', 6, 168],
      [2, 'Diya Nair', 5, 119],
      [3, 'Aarav Menon', 5, 142],
      [4, 'Oliver Smith', 4, 201]
    ]);
  });

  it('ranks the faster player first on q3 where both score 4 out of 5', async () => {
    const { entries } = await setup().service.getLeaderboard('q3', 10, 'u1');

    expect(entries.map(entry => entry.userId)).toEqual(['u2', 'u3']);
  });

  it("returns the current user's entry even outside the limit", async () => {
    const leaderboard = await setup().service.getLeaderboard('q1', 2, 'u1');

    expect(leaderboard.entries).toHaveLength(2);
    expect(leaderboard.currentUser).toMatchObject({ rank: 3, userId: 'u1' });
    expect(leaderboard.rankedCount).toBe(4);
  });

  it('returns no entry for a user who has not completed the quiz', async () => {
    const leaderboard = await setup().service.getLeaderboard('q1', 10, 'u5');

    expect(leaderboard.currentUser).toBeNull();
  });

  it('rejects an unknown quiz', async () => {
    await expect(setup().service.getLeaderboard('q99', 10, 'u1')).rejects.toThrow('Quiz not found');
  });
});

describe('subscribe', () => {
  it('calls the listener when data changes and stops after unsubscribing', () => {
    const { store, service } = setup();
    let calls = 0;
    const unsubscribe = service.subscribe(() => {
      calls += 1;
    });

    store.setState({ quizzes: [] });
    unsubscribe();
    store.setState({ quizzes: [] });

    expect(calls).toBe(1);
  });
});
