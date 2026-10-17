import { useEffect, useState } from 'react';
import type { UserOption } from '../components/UserSelect/types';
import { quizService } from '../service/quizService';

export const useUserOptions = () => {
  const [options, setOptions] = useState<UserOption[]>([]);

  useEffect(() => {
    let active = true;

    void quizService.getUsers().then(users => {
      if (active) setOptions(users.map(user => ({ value: user.id, label: user.name })));
    });

    return () => {
      active = false;
    };
  }, []);

  return options;
};
