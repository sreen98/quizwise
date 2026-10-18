import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useSessionStore } from '../session/sessionStore';
import { useLeaveAttemptPages } from './useLeaveAttemptPages';

export const useSwitchUser = (onDone?: () => void) => {
  const userId = useSessionStore(state => state.userId);
  const setUserId = useSessionStore(state => state.setUserId);
  const hasUnsavedChanges = useSessionStore(state => state.hasUnsavedChanges);
  const leaveAttemptPages = useLeaveAttemptPages();

  const switchUser = (value: string) => {
    setUserId(value);
    leaveAttemptPages();
    onDone?.();
  };

  return (value: string) => {
    if (value === userId) {
      onDone?.();
      return;
    }
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
};
