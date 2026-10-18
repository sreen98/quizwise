import { quizService } from '../service/quizService';
import { useSessionStore } from '../session/sessionStore';
import { useLeaveAttemptPages } from './useLeaveAttemptPages';

export const useLoadTestData = () => {
  const setCountryFilter = useSessionStore(state => state.setCountryFilter);
  const leaveAttemptPages = useLeaveAttemptPages();

  return async () => {
    leaveAttemptPages();
    setCountryFilter(null);
    await quizService.loadTestData();
  };
};
