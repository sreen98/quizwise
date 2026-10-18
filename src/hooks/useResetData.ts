import { quizService } from '../service/quizService';
import { DEFAULT_USER_ID, useSessionStore } from '../session/sessionStore';
import { useLeaveAttemptPages } from './useLeaveAttemptPages';

export const useResetData = () => {
  const setCountryFilter = useSessionStore(state => state.setCountryFilter);
  const setUserId = useSessionStore(state => state.setUserId);
  const leaveAttemptPages = useLeaveAttemptPages();

  return async () => {
    leaveAttemptPages();
    setCountryFilter(null);
    const seedUsers = await quizService.getSeedUsers();
    if (!seedUsers.some(user => user.id === useSessionStore.getState().userId)) setUserId(DEFAULT_USER_ID);
    await quizService.resetData();
  };
};
