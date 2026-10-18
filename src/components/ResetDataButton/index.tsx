import { Button, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useResetData } from '../../hooks/useResetData';
import type { ResetDataButtonProps } from './types';

export const ResetDataButton = ({ onDialogOpen }: ResetDataButtonProps) => {
  const resetData = useResetData();

  const handleClick = () => {
    onDialogOpen();
    modals.openConfirmModal({
      title: 'Reset all data?',
      children: (
        <Text size="sm">This restores the original quizzes and attempts and removes everything you changed.</Text>
      ),
      labels: { confirm: 'Yes', cancel: 'Cancel' },
      confirmProps: { color: 'orange' },
      onConfirm: () => {
        void resetData().then(() => {
          notifications.show({ message: 'Data reset' });
        });
      }
    });
  };

  return (
    <Button variant="light" color="orange" fullWidth onClick={handleClick}>
      Reset data
    </Button>
  );
};
