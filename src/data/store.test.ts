import { beforeEach, describe, expect, it } from 'vitest';
import { createDataStore, resetDataStore, STORAGE_KEY } from './store';

const readStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as { state: { quizzes: unknown[] } };

describe('data store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('copies the seed into storage on first load', () => {
    createDataStore();

    expect(readStorage().state.quizzes).toHaveLength(5);
  });

  it('keeps changes after a reload', () => {
    const store = createDataStore();
    store.setState({ quizzes: store.getState().quizzes.filter(quiz => quiz.id !== 'q1') });

    const reloaded = createDataStore();

    expect(reloaded.getState().quizzes.map(quiz => quiz.id)).toEqual(['q2', 'q3', 'q4', 'q5']);
  });

  it('falls back to the seed when storage holds broken JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');

    const store = createDataStore();

    expect(store.getState().quizzes).toHaveLength(5);
    expect(readStorage().state.quizzes).toHaveLength(5);
  });

  it('falls back to the seed when stored data has the wrong shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { quizzes: 'nope' }, version: 1 }));

    const store = createDataStore();

    expect(store.getState().quizzes).toHaveLength(5);
    expect(store.getState().users).toHaveLength(5);
  });

  it('marks completed seed attempts as submitted and keeps the in progress one open', () => {
    const { attempts } = createDataStore().getState();
    const inProgress = attempts.find(attempt => attempt.id === 'a11');

    expect(inProgress).toMatchObject({ status: 'in_progress', endReason: null });
    expect(
      attempts.filter(attempt => attempt.status === 'completed').every(attempt => attempt.endReason === 'submitted')
    ).toBe(true);
  });

  it('restores the seed on reset', () => {
    const store = createDataStore();
    store.setState({
      quizzes: store.getState().quizzes.filter(quiz => quiz.id !== 'q1'),
      attempts: store.getState().attempts.map(attempt => ({ ...attempt, status: 'closed' as const }))
    });

    resetDataStore(store);

    expect(store.getState().quizzes).toHaveLength(5);
    expect(store.getState().attempts.find(attempt => attempt.id === 'a11')?.status).toBe('in_progress');
  });

  it('keeps the reset after a reload', () => {
    const store = createDataStore();
    store.setState({ quizzes: [] });

    resetDataStore(store);

    expect(createDataStore().getState().quizzes).toHaveLength(5);
  });

  it('keeps the stored score and time of completed seed attempts', () => {
    const attempt = createDataStore()
      .getState()
      .attempts.find(item => item.id === 'a1');

    expect(attempt).toMatchObject({ score: 5, percentage: 83.3, timeTakenSeconds: 142 });
  });
});
