import { Avatar, CheckIcon, Group, Select, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useLeaveAttemptPages } from '../../hooks/useLeaveAttemptPages';
import { useSessionStore } from '../../session/sessionStore';
import type { UserSelectProps } from './types';

const avatar = (name: string, size: number) => (
  <Avatar name={name} color="blue" variant="light" size={size} aria-hidden />
);

export const UserSelect = ({ userOptions, onDone }: UserSelectProps) => {
  const userId = useSessionStore(state => state.userId);
  const setUserId = useSessionStore(state => state.setUserId);
  const hasUnsavedChanges = useSessionStore(state => state.hasUnsavedChanges);
  const leaveAttemptPages = useLeaveAttemptPages();
  const loaded = userOptions.length > 0;

  const switchUser = (value: string) => {
    setUserId(value);
    leaveAttemptPages();
    onDone?.();
  };

  const handleChange = (value: string | null) => {
    if (!value || value === userId) return;
    if (!hasUnsavedChanges) {
      switchUser(value);
      return;
    }
    modals.openConfirmModal({
      title: 'Switch user without saving?',
      children: <Text size="sm">Your changes to this quiz will be lost.</Text>,
      labels: { confirm: 'Switch user', cancel: 'Keep editing' },
      confirmProps: { color: 'orange' },
      onConfirm: () => {
        switchUser(value);
      }
    });
  };

  const selectedName = userOptions.find(option => option.value === userId)?.label;

  return (
    <Select
      aria-label="Viewing as"
      data={userOptions}
      value={loaded ? userId : null}
      onChange={handleChange}
      placeholder="Loading users"
      disabled={!loaded}
      allowDeselect={false}
      leftSection={selectedName && avatar(selectedName, 24)}
      renderOption={({ option, checked }) => (
        <Group gap={10} wrap="nowrap" flex={1}>
          {avatar(option.label, 28)}
          <Text fz="sm" flex={1}>
            {option.label}
          </Text>
          {checked && <CheckIcon size={12} aria-hidden />}
        </Group>
      )}
      w={{ base: '100%', sm: 240 }}
    />
  );
};
