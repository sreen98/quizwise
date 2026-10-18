import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_USER_ID, useSessionStore } from './sessionStore';

const KEY = 'quizwise:session';

const restoreFrom = async (state: unknown) => {
  localStorage.setItem(KEY, JSON.stringify({ state, version: 0 }));
  await useSessionStore.persist.rehydrate();
  return useSessionStore.getState();
};

describe('session store', () => {
  afterEach(() => {
    localStorage.removeItem(KEY);
    useSessionStore.setState({ userId: DEFAULT_USER_ID, countryFilter: null, slowNetwork: true });
  });

  it('restores a saved session', async () => {
    const state = await restoreFrom({ userId: 'u3', countryFilter: ['GB', 'AE'], slowNetwork: false });

    expect(state).toMatchObject({ userId: 'u3', countryFilter: ['GB', 'AE'], slowNetwork: false });
  });

  it('resets only the fields that have the wrong shape', async () => {
    const state = await restoreFrom({ userId: 'u3', countryFilter: 'IN', slowNetwork: 'no' });

    expect(state).toMatchObject({ userId: 'u3', countryFilter: null, slowNetwork: true });
  });

  it('falls back to the defaults when the saved session is not an object', async () => {
    const state = await restoreFrom('broken');

    expect(state).toMatchObject({ userId: DEFAULT_USER_ID, countryFilter: null, slowNetwork: true });
  });
});
