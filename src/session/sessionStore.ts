import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as latency from '../service/latency';

interface SessionState {
  userId: string;
  countryFilter: string[] | null;
  slowNetwork: boolean;
  hasUnsavedChanges: boolean;
  setUserId: (userId: string) => void;
  setCountryFilter: (countryFilter: string[] | null) => void;
  setSlowNetwork: (enabled: boolean) => void;
  setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
}

export const DEFAULT_USER_ID = 'u1';

export const useSessionStore = create<SessionState>()(
  persist(
    set => ({
      userId: DEFAULT_USER_ID,
      countryFilter: null,
      slowNetwork: true,
      hasUnsavedChanges: false,
      setUserId: userId => {
        set({ userId, countryFilter: null });
      },
      setCountryFilter: countryFilter => {
        set({ countryFilter });
      },
      setSlowNetwork: slowNetwork => {
        set({ slowNetwork });
      },
      setHasUnsavedChanges: hasUnsavedChanges => {
        set({ hasUnsavedChanges });
      }
    }),
    {
      name: 'quizwise:session',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ userId, countryFilter, slowNetwork }) => ({ userId, countryFilter, slowNetwork })
    }
  )
);

latency.setSlowNetwork(useSessionStore.getState().slowNetwork);
useSessionStore.subscribe(state => {
  latency.setSlowNetwork(state.slowNetwork);
});
