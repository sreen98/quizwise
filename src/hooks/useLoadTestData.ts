import { quizService } from '../service/quizService';
import { useSessionStore } from '../session/sessionStore';
import { useLeaveAttemptPages } from './useLeaveAttemptPages';

export const useLoadTestData = () => {
  const setCountry = useSessionStore(state => state.setCountry);
  const leaveAttemptPages = useLeaveAttemptPages();

  return async () => {
    leaveAttemptPages();
    setCountry(null);
    await quizService.loadTestData();
  };
};
