import { Button, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useLeaveAttemptPages } from '../../hooks/useLeaveAttemptPages';
import { quizService } from '../../service/quizService';
import { useSessionStore } from '../../session/sessionStore';
import type { ResetDataButtonProps } from './types';

export const ResetDataButton = ({ onDialogOpen }: ResetDataButtonProps) => {
  const setCountry = useSessionStore(state => state.setCountry);
  const leaveAttemptPages = useLeaveAttemptPages();

  const resetData = async () => {
    leaveAttemptPages();
    setCountry(null);
    await quizService.resetData();
    notifications.show({ message: 'Data reset' });
  };

  const handleClick = () => {
    onDialogOpen();
    modals.openConfirmModal({
      title: 'Reset all data?',
      children: (
        <Text size="sm">This restores the original quizzes and attempts and removes everything you changed.</Text>
      ),
      labels: { confirm: 'Reset data', cancel: 'Cancel' },
      confirmProps: { color: 'orange' },
      onConfirm: () => {
        void resetData();
      }
    });
  };

  return (
    <Button variant="subtle" color="gray" onClick={handleClick}>
      Reset data
    </Button>
  );
};
