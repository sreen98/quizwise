import { Select } from '@mantine/core';
import { useLeaveAttemptPages } from '../../hooks/useLeaveAttemptPages';
import { useSessionStore } from '../../session/sessionStore';
import type { UserSelectProps } from './types';

export const UserSelect = ({ userOptions, onDone }: UserSelectProps) => {
  const userId = useSessionStore(state => state.userId);
  const setUserId = useSessionStore(state => state.setUserId);
  const leaveAttemptPages = useLeaveAttemptPages();
  const loaded = userOptions.length > 0;

  const handleChange = (value: string | null) => {
    if (!value || value === userId) return;
    setUserId(value);
    leaveAttemptPages();
    onDone?.();
  };

  return (
    <Select
      aria-label="Viewing as"
      data={userOptions}
      value={loaded ? userId : null}
      onChange={handleChange}
      placeholder="Loading users"
      disabled={!loaded}
      allowDeselect={false}
      w={{ base: '100%', sm: 240 }}
    />
  );
};
