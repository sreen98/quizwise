import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDataStore } from '../data/store';
import type { Attempt, QuizInput } from '../types/models';
import { createQuizService } from './quizService';

const NOW = Date.parse('2026-10-17T10:00:00Z');
const later = (seconds: number) => NOW + seconds * 1000;

const setup = () => {
  localStorage.clear();
  const store = createDataStore();
  const clock = { now: NOW };
  return { store, clock, service: createQuizService(store, { now: () => clock.now }) };
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
      questionTypes: ['single', 'multiple'],
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

describe('getQuizSummary', () => {
  it("returns one quiz with the user's progress, like the quiz list", async () => {
    const { service } = setup();

    expect(await service.getQuizSummary('q3', 'u1')).toMatchObject({
      id: 'q3',
      completed: false,
      inProgress: { attemptId: 'a11', answeredCount: 2 }
    });
    expect(await service.getQuizSummary('q2', 'u1')).toMatchObject({ completed: true, bestAttemptId: 'a5' });
  });

  it('rejects an unknown quiz or user', async () => {
    const { service } = setup();

    await expect(service.getQuizSummary('q99', 'u1')).rejects.toThrow('Quiz not found');
    await expect(service.getQuizSummary('q1', 'nobody')).rejects.toThrow('User not found');
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

  it('includes the quiz title, country and completion date', async () => {
    const leaderboard = await setup().service.getLeaderboard('q1', 10, 'u1');

    expect(leaderboard).toMatchObject({ quizTitle: 'JavaScript Basics', retakesAllowed: true });
    expect(leaderboard.entries[0]).toMatchObject({
      userName: 'Fatima Al Mansoori',
      countryName: 'United Arab Emirates'
    });
    expect(leaderboard.entries[0]?.completedAt).toEqual(expect.any(String));
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
      quizTitle: 'JavaScript Basics',
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

const startQ2 = async () => {
  const context = setup();
  const { attemptId } = await context.service.startOrResumeAttempt('q2', 'u5');
  return { ...context, attemptId };
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

    await service.saveDraft(attemptId, 'q1-1', wrong(0));
    const reloaded = createQuizService(createDataStore(), { now: () => NOW });

    expect(await reloaded.getCurrentQuestion(attemptId)).toMatchObject({ index: 0, draftOptionIds: wrong(0) });
  });

  it('ignores a draft for a question that is no longer current', async () => {
    const { store, clock, service, attemptId } = await startQ2();

    clock.now = later(31);
    await service.saveDraft(attemptId, 'q2-1', ['q2-1-o2']);

    const attempt = store.getState().attempts.find(item => item.id === attemptId);
    expect(attempt).toMatchObject({ currentQuestionIndex: 1, draftOptionIds: [] });
  });

  it('rejects a draft with an option from another question', async () => {
    const { service, attemptId, correct } = await startQ1();

    await expect(service.saveDraft(attemptId, 'q1-1', correct(1))).rejects.toThrow('Invalid answer');
  });
});

describe('answer selection', () => {
  it('rejects two options for a single choice question', async () => {
    const { service, attemptId, questions } = await startQ1();
    const options = questions[0]?.options.slice(0, 2).map(option => option.id) ?? [];

    await expect(service.submitAnswer(attemptId, 'q1-1', options)).rejects.toThrow('Invalid answer');
  });

  it('stores each selected option once', async () => {
    const { service, attemptId, correct, answers } = await startQ1();

    await service.submitAnswer(attemptId, 'q1-1', [...correct(0), ...correct(0)]);

    expect(answers()[0]?.selectedOptionIds).toEqual(correct(0));
  });

  it('records the last answer and the finish at the same moment', async () => {
    const { store, clock, service, attemptId, questions, correct } = await startQ1();

    for (const [index, question] of questions.entries()) {
      clock.now = later(10 * (index + 1));
      await service.submitAnswer(attemptId, question.id, correct(index));
    }

    const attempt = store.getState().attempts.find(item => item.id === attemptId);
    expect(attempt?.completedAt).toBe(attempt?.answers.at(-1)?.answeredAt);
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

describe('quiz edited or deleted during an attempt', () => {
  type Store = ReturnType<typeof setup>['store'];

  const editQuiz = (store: Store, quizId: string) => {
    store.setState(state => ({
      quizzes: state.quizzes.map(quiz => (quiz.id === quizId ? { ...quiz, version: quiz.version + 1 } : quiz))
    }));
  };

  const deleteQuiz = (store: Store, quizId: string) => {
    store.setState(state => ({ quizzes: state.quizzes.filter(quiz => quiz.id !== quizId) }));
  };

  it('closes the attempt when the quiz is edited', async () => {
    const { store, service, attemptId } = await startQ1();
    editQuiz(store, 'q1');

    expect(await service.getCurrentQuestion(attemptId)).toEqual({ status: 'closed', endReason: 'quiz_changed' });
    expect(store.getState().attempts.find(attempt => attempt.id === attemptId)).toMatchObject({
      status: 'closed',
      endReason: 'quiz_changed',
      score: null,
      completedAt: null
    });
  });

  it('ignores an answer submitted after the quiz was edited', async () => {
    const { store, service, attemptId, correct, answers } = await startQ1();
    editQuiz(store, 'q1');

    const result = await service.submitAnswer(attemptId, 'q1-1', correct(0));

    expect(result).toEqual({ status: 'closed', endReason: 'quiz_changed' });
    expect(answers()).toEqual([]);
  });

  it('closes the attempt when the quiz is deleted', async () => {
    const { store, service, attemptId } = await startQ1();
    deleteQuiz(store, 'q1');

    expect(await service.getCurrentQuestion(attemptId)).toEqual({ status: 'closed', endReason: 'quiz_deleted' });
  });

  it('lets the user start again after a closed attempt even without retakes', async () => {
    const { store, service } = setup();
    const first = await service.startOrResumeAttempt('q2', 'u5');
    editQuiz(store, 'q2');
    await service.getCurrentQuestion(first.attemptId);

    const second = await service.startOrResumeAttempt('q2', 'u5');
    const listed = (await service.getQuizzes('u5')).find(quiz => quiz.id === 'q2');

    expect(second).toMatchObject({ resumed: false });
    expect(second.attemptId).not.toBe(first.attemptId);
    expect(listed).toMatchObject({ completed: false, bestScore: null });
  });

  it('refuses to complete a closed attempt', async () => {
    const { store, service, attemptId } = await startQ1();
    editQuiz(store, 'q1');

    await expect(service.completeAttempt(attemptId)).rejects.toThrow('Attempt was closed');
  });
});

describe('attempt ownership', () => {
  it("refuses another user's attempt without changing it", async () => {
    const { store, service } = setup();

    await expect(service.getCurrentQuestion('a11', 'u2')).rejects.toThrow('Attempt not found');
    await expect(service.submitAnswer('a11', 'q3-3', [], 'u2')).rejects.toThrow('Attempt not found');
    await expect(service.getAttemptResult('a1', 'u2')).rejects.toThrow('Attempt not found');
    await expect(service.getEndedAttempt('a1', 'u2')).rejects.toThrow('Attempt not found');

    expect(store.getState().attempts.find(attempt => attempt.id === 'a11')?.status).toBe('in_progress');
  });

  it('opens the attempt for its own user', async () => {
    const { service } = setup();

    expect(await service.getAttemptResult('a1', 'u1')).toMatchObject({ status: 'completed', score: 5 });
  });
});

describe('getAttemptResult', () => {
  it('returns the score, rank and question breakdown of a finished attempt', async () => {
    const { service } = setup();

    const result = await service.getAttemptResult('a1');

    expect(result).toMatchObject({
      status: 'completed',
      quizTitle: 'JavaScript Basics',
      userName: 'Aarav Menon',
      score: 5,
      totalQuestions: 6,
      correctCount: 5,
      incorrectCount: 1,
      timeTakenSeconds: 142,
      retakesAllowed: true,
      rank: 3,
      rankedCount: 4,
      best: { score: 5, totalQuestions: 6 }
    });
    expect(result.status === 'completed' && result.breakdown?.map(item => item.isCorrect)).toEqual([
      true,
      true,
      true,
      true,
      false,
      true
    ]);
  });

  it('leaves out the breakdown once the quiz has changed since the attempt', async () => {
    const { service } = setup();
    await service.updateQuiz('q1', { ...(await service.getQuizForEdit('q1')), title: 'JavaScript Basics, revised' });

    expect(await service.getAttemptResult('a1')).toMatchObject({ score: 5, breakdown: null });
  });

  it('does not finish an attempt that is still in progress', async () => {
    const { store, service } = setup();
    const { attemptId } = await service.startOrResumeAttempt('q1', 'u5');

    expect(await service.getAttemptResult(attemptId)).toEqual({ status: 'in_progress' });
    expect(store.getState().attempts.find(attempt => attempt.id === attemptId)?.status).toBe('in_progress');
  });

  it('has no result for a closed attempt', async () => {
    const { service } = setup();
    const { attemptId } = await service.startOrResumeAttempt('q1', 'u5');
    await service.deleteQuiz('q1');

    await expect(service.getAttemptResult(attemptId)).rejects.toThrow('Result not found');
  });
});

describe('getEndedAttempt', () => {
  it('describes an attempt that timed out while the user was away', async () => {
    const { service } = setup();

    expect(await service.getEndedAttempt('a11')).toMatchObject({
      quizTitle: 'World Geography',
      status: 'completed',
      endReason: 'timeout',
      startedAt: '2026-10-16T09:00:00Z',
      timeLimitSeconds: 240,
      answeredCount: 2,
      totalQuestions: 5,
      score: 2,
      percentage: 40,
      timeTakenSeconds: 240
    });
  });

  it('keeps the earlier best result when the quiz was updated during the attempt', async () => {
    const { service } = setup();
    const { attemptId } = await service.startOrResumeAttempt('q1', 'u1');
    await service.updateQuiz('q1', { ...(await service.getQuizForEdit('q1')), description: 'Revised' });

    expect(await service.getEndedAttempt(attemptId)).toMatchObject({
      quizTitle: 'JavaScript Basics',
      status: 'closed',
      endReason: 'quiz_changed',
      score: null,
      bestResult: { score: 5, totalQuestions: 6 },
      canStartAgain: true
    });
  });

  it('cannot start a deleted quiz again and has no title for it', async () => {
    const { service } = setup();
    const { attemptId } = await service.startOrResumeAttempt('q2', 'u5');
    await service.deleteQuiz('q2');

    expect(await service.getEndedAttempt(attemptId)).toMatchObject({
      quizTitle: null,
      status: 'closed',
      endReason: 'quiz_deleted',
      canStartAgain: false
    });
  });

  it('refuses an attempt that is still in progress', async () => {
    const { service } = setup();
    const { attemptId } = await service.startOrResumeAttempt('q1', 'u5');

    await expect(service.getEndedAttempt(attemptId)).rejects.toThrow('Attempt is still in progress');
  });
});

const newQuiz = (correctOptionIds = ['paris']): QuizInput => ({
  title: 'Capitals',
  description: 'European capitals',
  countries: ['GB'],
  timeLimitSeconds: 120,
  perQuestionSeconds: null,
  retakesAllowed: true,
  questions: [
    {
      id: 'capital-1',
      text: 'Capital of France?',
      type: 'single',
      options: [
        { id: 'paris', text: 'Paris' },
        { id: 'rome', text: 'Rome' }
      ],
      correctOptionIds
    }
  ]
});

describe('createQuiz', () => {
  it('saves a new quiz with its own id and version 1', async () => {
    const { service } = setup();

    const created = await service.createQuiz(newQuiz());
    const listed = await service.getQuizzes('u3');

    expect(created).toMatchObject({ title: 'Capitals', version: 1 });
    expect(created.id).toEqual(expect.any(String));
    expect(listed.map(quiz => quiz.id)).toContain(created.id);
  });

  it('rejects an invalid quiz with the validation message', async () => {
    await expect(setup().service.createQuiz(newQuiz(['paris', 'rome']))).rejects.toThrow(
      'A single choice question needs exactly one correct option'
    );
  });
});

describe('updateQuiz', () => {
  it('saves the changes, keeps the id and increases the version', async () => {
    const { service } = setup();
    const created = await service.createQuiz(newQuiz());

    const updated = await service.updateQuiz(created.id, { ...newQuiz(), title: 'World capitals' });

    expect(updated).toMatchObject({ id: created.id, title: 'World capitals', version: 2 });
    expect(await service.getQuiz(created.id)).toMatchObject({ title: 'World capitals' });
  });

  it('closes an attempt that is in progress on the updated quiz', async () => {
    const { service, attemptId } = await startQ1();
    const q1 = await service.getQuizForEdit('q1');

    await service.updateQuiz('q1', { ...q1, title: 'JavaScript Basics, revised' });

    expect(await service.getCurrentQuestion(attemptId)).toEqual({ status: 'closed', endReason: 'quiz_changed' });
  });

  it('keeps the version and running attempts when saved without changes', async () => {
    const { service, attemptId } = await startQ1();
    const q1 = await service.getQuizForEdit('q1');

    const saved = await service.updateQuiz('q1', await service.exportQuiz('q1'));

    expect(saved.version).toBe(q1.version);
    expect(await service.getCurrentQuestion(attemptId)).toMatchObject({ status: 'in_progress' });
  });

  it('rejects an unknown quiz', async () => {
    await expect(setup().service.updateQuiz('q99', newQuiz())).rejects.toThrow('Quiz not found');
  });
});

describe('deleteQuiz', () => {
  it('removes the quiz and its completed attempts', async () => {
    const { store, service } = setup();

    await service.deleteQuiz('q1');

    expect(store.getState().quizzes.map(quiz => quiz.id)).not.toContain('q1');
    expect(store.getState().attempts.filter(attempt => attempt.quizId === 'q1')).toEqual([]);
    await expect(service.getLeaderboard('q1', 10, 'u1')).rejects.toThrow('Quiz not found');
  });

  it('keeps an in progress attempt so it closes as deleted', async () => {
    const { store, service } = setup();

    await service.deleteQuiz('q3');

    expect(store.getState().attempts.map(attempt => attempt.id)).toContain('a11');
    expect(await service.getCurrentQuestion('a11')).toEqual({ status: 'closed', endReason: 'quiz_deleted' });
  });

  it('rejects an unknown quiz', async () => {
    await expect(setup().service.deleteQuiz('q99')).rejects.toThrow('Quiz not found');
  });
});

describe('getAdminQuizzes', () => {
  it('lists every quiz in every country with its number of attempts', async () => {
    const quizzes = await setup().service.getAdminQuizzes();

    expect(quizzes.map(quiz => [quiz.id, quiz.attemptCount])).toEqual([
      ['q1', 4],
      ['q2', 2],
      ['q3', 3],
      ['q4', 1],
      ['q5', 1]
    ]);
    expect(quizzes[0]).not.toHaveProperty('questions');
  });
});

describe('getQuizForEdit', () => {
  it('includes the correct answers for the admin editor', async () => {
    const quiz = await setup().service.getQuizForEdit('q1');

    expect(quiz.questions[0]).toHaveProperty('correctOptionIds', ['q1-1-o3']);
  });

  it('rejects an unknown quiz', async () => {
    await expect(setup().service.getQuizForEdit('q99')).rejects.toThrow('Quiz not found');
  });
});

describe('exportQuiz', () => {
  it('returns the quiz with its answers but without its id or version', async () => {
    const exported = await setup().service.exportQuiz('q1');

    expect(exported).toMatchObject({ title: 'JavaScript Basics' });
    expect(exported.questions[0]).toHaveProperty('correctOptionIds', ['q1-1-o3']);
    expect(exported).not.toHaveProperty('id');
    expect(exported).not.toHaveProperty('version');
  });

  it('rejects an unknown quiz', async () => {
    await expect(setup().service.exportQuiz('q99')).rejects.toThrow('Quiz not found');
  });
});

describe('importQuiz', () => {
  it('adds an exported quiz back as a new quiz', async () => {
    const { service } = setup();
    const exported = await service.exportQuiz('q1');

    const result = await service.importQuiz(JSON.stringify(exported));
    const copies = (await service.getAdminQuizzes()).filter(quiz => quiz.title === 'JavaScript Basics');

    expect(result).toEqual({ isImported: true, title: 'JavaScript Basics' });
    expect(copies).toHaveLength(2);
    expect(copies[1]).toMatchObject({ questionCount: exported.questions.length, attemptCount: 0 });
  });

  it('says when the file is not JSON', async () => {
    await expect(setup().service.importQuiz('{ title: ')).resolves.toEqual({
      isImported: false,
      problems: ["This file isn't valid JSON."]
    });
  });

  it('says when the file does not contain a quiz', async () => {
    await expect(setup().service.importQuiz('[1, 2]')).resolves.toEqual({
      isImported: false,
      problems: ["This file doesn't contain a quiz."]
    });
  });

  it('names where each problem is', async () => {
    const quiz = newQuiz([]);
    const broken = {
      ...quiz,
      title: ' ',
      retakesAllowed: 'yes',
      questions: [{ ...quiz.questions[0], options: [{ id: 'paris', text: '' }, quiz.questions[0]?.options[1]] }]
    };

    const result = await setup().service.importQuiz(JSON.stringify(broken));

    expect(result).toEqual({
      isImported: false,
      problems: [
        'Title: Enter a title',
        'Allow retakes: Missing or not the right kind of value',
        'Question 1, option 1: Enter the option text',
        'Question 1, correct answers: Mark at least one correct option'
      ]
    });
  });

  it('names the allowed values when a value is not one of them', async () => {
    const quiz = newQuiz();
    const broken = { ...quiz, questions: [{ ...quiz.questions[0], type: 'true_false' }] };

    await expect(setup().service.importQuiz(JSON.stringify(broken))).resolves.toEqual({
      isImported: false,
      problems: ['Question 1, answer type: Use one of single, multiple']
    });
  });

  it('rejects a country listed twice', async () => {
    await expect(
      setup().service.importQuiz(JSON.stringify({ ...newQuiz(), countries: ['GB', 'GB'] }))
    ).resolves.toEqual({ isImported: false, problems: ['Available in: Each country can only be picked once'] });
  });

  it('rejects a country the app does not know', async () => {
    const { service } = setup();

    const result = await service.importQuiz(JSON.stringify({ ...newQuiz(), countries: ['GB', 'XX'] }));

    expect(result).toEqual({ isImported: false, problems: ['Available in: Unknown country code XX'] });
    expect((await service.getAdminQuizzes()).some(quiz => quiz.title === 'Capitals')).toBe(false);
  });
});

describe('simulated delay', () => {
  const slowService = () => {
    localStorage.clear();
    const store = createDataStore();
    return { store, service: createQuizService(store, { now: () => NOW, delay: () => 500 }) };
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  it('answers only after the delay', async () => {
    vi.useFakeTimers();
    let answered = false;
    void slowService()
      .service.getQuiz('q1')
      .then(() => {
        answered = true;
      });

    await vi.advanceTimersByTimeAsync(499);
    expect(answered).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(answered).toBe(true);
  });

  it('saves a change straight away even though the reply is delayed', async () => {
    vi.useFakeTimers();
    const { store, service } = slowService();

    const started = service.startOrResumeAttempt('q1', 'u5');

    expect(store.getState().attempts.some(attempt => attempt.userId === 'u5')).toBe(true);
    await vi.advanceTimersByTimeAsync(500);
    await expect(started).resolves.toMatchObject({ resumed: false });
  });

  it('still rejects after the delay when something is wrong', async () => {
    vi.useFakeTimers();
    const failed = slowService().service.getQuiz('q99');
    const assertion = expect(failed).rejects.toThrow('Quiz not found');

    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });
});

describe('returned data', () => {
  it('cannot change the stored quiz when the editor copy is changed', async () => {
    const { store, service } = setup();

    const quiz = await service.getQuizForEdit('q1');
    quiz.title = 'Changed without saving';
    quiz.questions.pop();

    const stored = store.getState().quizzes.find(item => item.id === 'q1');
    expect(stored?.title).toBe('JavaScript Basics');
    expect(stored?.questions).toHaveLength(6);
  });

  it('cannot change stored users or a saved draft through the returned values', async () => {
    const { store, service, attemptId, wrong } = await startQ1();
    await service.saveDraft(attemptId, 'q1-1', wrong(0));

    const users = await service.getUsers();
    users.pop();
    const current = await service.getCurrentQuestion(attemptId);
    if (current.status === 'in_progress') current.draftOptionIds.push('q1-1-o4');

    expect(store.getState().users).toHaveLength(5);
    expect(store.getState().attempts.find(item => item.id === attemptId)?.draftOptionIds).toEqual(wrong(0));
  });
});
