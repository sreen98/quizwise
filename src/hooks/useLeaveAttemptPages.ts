import { useLocation, useNavigate } from 'react-router';

export const useLeaveAttemptPages = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return () => {
    if (pathname.startsWith('/attempts')) {
      void navigate('/quizzes');
    }
  };
};
