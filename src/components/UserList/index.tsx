import { Avatar, CheckIcon, ScrollArea, Skeleton, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { useSwitchUser } from '../../hooks/useSwitchUser';
import { useSessionStore } from '../../session/sessionStore';
import classes from './UserList.module.css';
import type { UserListProps } from './types';

export const UserList = ({ userOptions, onDone }: UserListProps) => {
  const userId = useSessionStore(state => state.userId);
  const switchUser = useSwitchUser(onDone);
  const { search, setSearch, debouncedSearch, query } = useDebouncedSearch();
  const shown = userOptions.filter(option => option.label.toLowerCase().includes(query));

  return (
    <Stack component="section" aria-labelledby="user-list-title" gap={8}>
      <Text id="user-list-title" fz={14} fw={600} c="dimmed">
        Viewing as
      </Text>
      <TextInput
        aria-label="Search users"
        placeholder="Search users"
        leftSection={<IconSearch size={16} aria-hidden />}
        value={search}
        onChange={event => {
          setSearch(event.currentTarget.value);
        }}
      />
      {userOptions.length === 0 && [1, 2, 3].map(index => <Skeleton key={index} h={52} radius="md" />)}
      {userOptions.length > 0 && shown.length === 0 && (
        <Text c="dimmed" fz={14} py={12} role="status">
          No users match "{debouncedSearch.trim()}".
        </Text>
      )}
      <ScrollArea.Autosize mah="40dvh" type="auto" offsetScrollbars>
        <Stack gap={4}>
          {shown.map(option => (
            <UnstyledButton
              key={option.value}
              className={classes.user}
              aria-pressed={option.value === userId}
              onClick={() => {
                switchUser(option.value);
              }}
            >
              <Avatar name={option.label} color="blue" variant="light" size={32} aria-hidden />
              <Text component="span" inherit flex={1}>
                {option.label}
              </Text>
              {option.value === userId && <CheckIcon size={14} aria-hidden />}
            </UnstyledButton>
          ))}
        </Stack>
      </ScrollArea.Autosize>
    </Stack>
  );
};
