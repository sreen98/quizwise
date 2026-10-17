import { useEffect, useState } from 'react';
import { quizService } from '../service/quizService';
import { useSessionStore } from '../session/sessionStore';
import type { User } from '../types/models';

export const useCurrentUser = () => {
  const userId = useSessionStore(state => state.userId);
  const [users, setUsers] = useState<User[] | null>(null);

  useEffect(() => {
    let active = true;

    void quizService.getUsers().then(list => {
      if (active) setUsers(list);
    });

    return () => {
      active = false;
    };
  }, []);

  const user = users?.find(item => item.id === userId) ?? null;
  const adminUser = users?.find(item => item.role === 'admin') ?? null;

  return { user, adminUser, loading: users === null, isAdmin: user?.role === 'admin' };
};
