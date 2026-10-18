import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore, type StoreApi } from 'zustand/vanilla';
import type { QuizData } from '../types/models';
import { migrateSeed } from './migrate';
import { readQuizData } from './schema';
import seed from './seed.json';

export const STORAGE_KEY = 'quizwise:v1';

export const createDataStore = () => {
  const store = createStore<QuizData>()(
    persist(() => migrateSeed(seed), {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: stored => readQuizData(stored) ?? migrateSeed(seed),
      merge: (stored, current) => readQuizData(stored) ?? current
    })
  );

  store.setState(store.getState(), true);
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) void store.persist.rehydrate();
  });
  return store;
};

export const resetDataStore = (store: StoreApi<QuizData>) => {
  store.setState(migrateSeed(seed), true);
};

export const seedUsers = () => migrateSeed(seed).users;

export const dataStore = createDataStore();
