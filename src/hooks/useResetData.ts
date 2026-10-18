import { quizService } from '../service/quizService';
import { useSessionStore } from '../session/sessionStore';
import { useLeaveAttemptPages } from './useLeaveAttemptPages';

export const useResetData = () => {
  const setCountryFilter = useSessionStore(state => state.setCountryFilter);
  const leaveAttemptPages = useLeaveAttemptPages();

  return async () => {
    leaveAttemptPages();
    setCountryFilter(null);
    await quizService.resetData();
  };
};
