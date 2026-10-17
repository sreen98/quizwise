import { beforeEach, describe, expect, it } from 'vitest';
import { createDataStore } from '../data/store';
import type { Attempt } from '../types/models';
import { createQuizService } from './quizService';

const NOW = Date.parse('2026-10-17T10:00:00Z');
const later = (seconds: number) => NOW + seconds * 1000;

const setup = () => {
  localStorage.clear();
  const store = createDataStore();
  const clock = { now: NOW };
  return { store, clock, service: createQuizService(store, () => clock.now) };
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

describe('startOrResumeAttempt', () => {
  it('starts a new attempt with no answers', async () => {
    const { store, service } = setup();

    const started = await service.startOrResumeAttempt('q1', 'u5');
    const attempt = store.getState().attempts.find(item => item.id === started.attemptId);

    expect(started.resumed).toBe(false);
    expect(attempt).toMatchObject({
      quizId: 'q1',
      userId: 'u5',
      quizVersion: 1,
      status: 'in_progress',
      startedAt: new Date(NOW).toISOString(),
      currentQuestionIndex: 0,
      answers: [],
      totalQuestions: 6
    });
  });

  it('resumes the attempt the user already has in progress', async () => {
    expect(await setup().service.startOrResumeAttempt('q3', 'u1')).toEqual({ attemptId: 'a11', resumed: true });
  });

  it('refuses a second attempt when retakes are not allowed', async () => {
    await expect(setup().service.startOrResumeAttempt('q2', 'u1')).rejects.toThrow('Retakes are not allowed');
  });

  it('allows a new attempt when retakes are allowed', async () => {
    const started = await setup().service.startOrResumeAttempt('q1', 'u1');

    expect(started.resumed).toBe(false);
    expect(started.attemptId).not.toBe('a1');
  });
});

describe('getCurrentQuestion', () => {
  it('returns the first question without the correct answers', async () => {
    const { service } = setup();
    const { attemptId } = await service.startOrResumeAttempt('q1', 'u5');

    const current = await service.getCurrentQuestion(attemptId);

    expect(current).toMatchObject({
      status: 'in_progress',
      index: 0,
      total: 6,
      overallDeadlineAt: later(300),
      questionDeadlineAt: null,
      deadlineAt: later(300),
      draftOptionIds: []
    });
    expect(current.status === 'in_progress' && current.question).not.toHaveProperty('correctOptionIds');
  });

  it('keeps the same deadline when the user comes back later', async () => {
    const { clock, service } = setup();
    const { attemptId } = await service.startOrResumeAttempt('q1', 'u5');

    clock.now = later(100);

    expect(await service.getCurrentQuestion(attemptId)).toMatchObject({ index: 0, deadlineAt: later(300) });
  });

  it('finishes a11 as a timeout because its time ran out while the user was away', async () => {
    const { store, service } = setup();

    expect(await service.getCurrentQuestion('a11')).toEqual({ status: 'completed', endReason: 'timeout' });

    const a11 = store.getState().attempts.find(attempt => attempt.id === 'a11');
    expect(a11).toMatchObject({
      status: 'completed',
      endReason: 'timeout',
      completedAt: '2026-10-16T09:04:00.000Z',
      score: 2,
      percentage: 40,
      timeTakenSeconds: 240
    });
    expect(a11?.answers).toHaveLength(3);
    expect(a11?.answers[2]).toMatchObject({ questionId: 'q3-3', selectedOptionIds: [], isCorrect: false });
  });

  it('catches up on several missed per question deadlines and submits the saved draft', async () => {
    const { store, clock, service } = setup();
    const { attemptId } = await service.startOrResumeAttempt('q2', 'u5');
    const firstQuestion = store.getState().quizzes.find(quiz => quiz.id === 'q2')?.questions[0];
    store.setState(state => ({
      attempts: state.attempts.map(attempt =>
        attempt.id === attemptId ? { ...attempt, draftOptionIds: firstQuestion?.correctOptionIds ?? [] } : attempt
      )
    }));

    clock.now = later(75);
    const current = await service.getCurrentQuestion(attemptId);

    expect(current).toMatchObject({ status: 'in_progress', index: 2, deadlineAt: later(90) });
    const answers = store.getState().attempts.find(attempt => attempt.id === attemptId)?.answers;
    expect(answers?.map(answer => [answer.isCorrect, answer.answeredAt])).toEqual([
      [true, new Date(later(30)).toISOString()],
      [false, new Date(later(60)).toISOString()]
    ]);
  });

  it('finishes the attempt when the last question times out', async () => {
    const { clock, service } = setup();
    const { attemptId } = await service.startOrResumeAttempt('q2', 'u5');

    clock.now = later(7 * 30 + 1);

    expect(await service.getCurrentQuestion(attemptId)).toEqual({ status: 'completed', endReason: 'timeout' });
  });

  it('rejects an unknown attempt', async () => {
    await expect(setup().service.getCurrentQuestion('nope')).rejects.toThrow('Attempt not found');
  });
});

const startQ1 = async () => {
  const context = setup();
  const { attemptId } = await context.service.startOrResumeAttempt('q1', 'u5');
  const questions = context.store.getState().quizzes.find(quiz => quiz.id === 'q1')?.questions ?? [];
  const correct = (index: number) => questions[index]?.correctOptionIds ?? [];
  const wrong = (index: number) => {
    const question = questions[index];
    const option = question?.options.find(item => !question.correctOptionIds.includes(item.id));
    return option ? [option.id] : [];
  };
  const answers = () => context.store.getState().attempts.find(attempt => attempt.id === attemptId)?.answers ?? [];
  return { ...context, attemptId, questions, correct, wrong, answers };
};

describe('submitAnswer', () => {
  it('records the answer and moves to the next question', async () => {
    const { service, attemptId, correct, answers } = await startQ1();

    const next = await service.submitAnswer(attemptId, 'q1-1', correct(0));

    expect(next).toMatchObject({ status: 'in_progress', index: 1 });
    expect(answers()).toEqual([
      { questionId: 'q1-1', selectedOptionIds: correct(0), isCorrect: true, answeredAt: new Date(NOW).toISOString() }
    ]);
  });

  it('ignores a repeated submit for the same question', async () => {
    const { service, attemptId, correct, wrong, answers } = await startQ1();

    await service.submitAnswer(attemptId, 'q1-1', correct(0));
    const repeated = await service.submitAnswer(attemptId, 'q1-1', wrong(0));

    expect(repeated).toMatchObject({ status: 'in_progress', index: 1 });
    expect(answers()).toHaveLength(1);
    expect(answers()[0]?.isCorrect).toBe(true);
  });

  it('stores a wrong choice as incorrect', async () => {
    const { service, attemptId, wrong, answers } = await startQ1();

    await service.submitAnswer(attemptId, 'q1-1', wrong(0));

    expect(answers()[0]?.isCorrect).toBe(false);
  });

  it('finishes the attempt after the last answer', async () => {
    const { store, service, attemptId, questions, correct, wrong } = await startQ1();

    let result = await service.getCurrentQuestion(attemptId);
    for (const [index, question] of questions.entries()) {
      result = await service.submitAnswer(attemptId, question.id, index === 0 ? wrong(0) : correct(index));
    }

    expect(result).toEqual({ status: 'completed', endReason: 'submitted' });
    expect(store.getState().attempts.find(attempt => attempt.id === attemptId)).toMatchObject({
      status: 'completed',
      score: 5,
      percentage: 83.3
    });
  });

  it('does not record an answer that arrives after the time ran out', async () => {
    const { clock, service, attemptId, correct, answers } = await startQ1();

    clock.now = later(301);
    const result = await service.submitAnswer(attemptId, 'q1-1', correct(0));

    expect(result).toEqual({ status: 'completed', endReason: 'timeout' });
    expect(answers()).toEqual([expect.objectContaining({ questionId: 'q1-1', selectedOptionIds: [] })]);
  });

  it('rejects an option from another question', async () => {
    const { service, attemptId, correct } = await startQ1();

    await expect(service.submitAnswer(attemptId, 'q1-1', correct(1))).rejects.toThrow('Invalid answer');
  });
});

describe('saveDraft', () => {
  it('keeps the current selection after a reload', async () => {
    const { service, attemptId, wrong } = await startQ1();

    await service.saveDraft(attemptId, wrong(0));
    const reloaded = createQuizService(createDataStore(), () => NOW);

    expect(await reloaded.getCurrentQuestion(attemptId)).toMatchObject({ index: 0, draftOptionIds: wrong(0) });
  });
});

describe('completeAttempt', () => {
  it('returns the score, counts and time taken', async () => {
    const { clock, service, attemptId, questions, correct, wrong } = await startQ1();

    for (const [index, question] of questions.entries()) {
      clock.now = later((index + 1) * 20);
      await service.submitAnswer(attemptId, question.id, index < 2 ? wrong(index) : correct(index));
    }

    expect(await service.completeAttempt(attemptId)).toMatchObject({
      score: 4,
      totalQuestions: 6,
      correctCount: 4,
      incorrectCount: 2,
      percentage: 66.7,
      timeTakenSeconds: 120,
      endReason: 'submitted'
    });
  });

  it('counts unanswered questions as incorrect when finishing early', async () => {
    const { clock, service, attemptId, correct } = await startQ1();

    await service.submitAnswer(attemptId, 'q1-1', correct(0));
    clock.now = later(50);

    expect(await service.completeAttempt(attemptId)).toMatchObject({
      score: 1,
      correctCount: 1,
      incorrectCount: 5,
      percentage: 16.7,
      timeTakenSeconds: 50
    });
  });

  it('returns the stored result of a completed seed attempt', async () => {
    expect(await setup().service.completeAttempt('a1')).toMatchObject({
      score: 5,
      totalQuestions: 6,
      percentage: 83.3,
      timeTakenSeconds: 142,
      endReason: 'submitted'
    });
  });
});
