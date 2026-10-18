import { Avatar, Box } from '@mantine/core';
import { useSwitchUser } from '../../hooks/useSwitchUser';
import { useSessionStore } from '../../session/sessionStore';
import { SearchableSelect } from '../SearchableSelect';
import type { UserSelectProps } from './types';

const avatar = (name: string) => <Avatar name={name} color="blue" variant="light" size={24} aria-hidden />;

export const UserSelect = ({ userOptions }: UserSelectProps) => {
  const userId = useSessionStore(state => state.userId);
  const switchUser = useSwitchUser();

  return (
    <Box w={240}>
      <SearchableSelect
        label="Viewing as"
        hideLabel
        searchLabel="Search users"
        nothingFoundMessage="No users found"
        data={userOptions}
        value={userId}
        onChange={switchUser}
        renderIcon={avatar}
      />
    </Box>
  );
};
