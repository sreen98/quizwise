import { useEffect, useState } from 'react';
import type { UserOption } from '../components/UserSelect/types';
import { quizService } from '../service/quizService';

export const useUserOptions = () => {
  const [options, setOptions] = useState<UserOption[]>([]);
  const [changes, setChanges] = useState(0);

  useEffect(
    () =>
      quizService.subscribe(() => {
        setChanges(count => count + 1);
      }),
    []
  );

  useEffect(() => {
    let active = true;

    void quizService.getUsers().then(users => {
      if (active) setOptions(users.map(user => ({ value: user.id, label: user.name })));
    });

    return () => {
      active = false;
    };
  }, [changes]);

  return options;
};
