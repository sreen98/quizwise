import { Button, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useLoadTestData } from '../../hooks/useLoadTestData';
import type { TestDataButtonProps } from './types';

export const TestDataButton = ({ onDialogOpen }: TestDataButtonProps) => {
  const loadTestData = useLoadTestData();

  const handleClick = () => {
    onDialogOpen();
    modals.openConfirmModal({
      title: 'Load test data?',
      children: (
        <Text size="sm">
          This replaces everything with the original data plus 45 quizzes, 45 users and their attempts, for testing long
          lists. Reset data brings back the original data.
        </Text>
      ),
      labels: { confirm: 'Load test data', cancel: 'Cancel' },
      onConfirm: () => {
        void loadTestData().then(() => {
          notifications.show({ message: 'Test data loaded' });
        });
      }
    });
  };

  return (
    <Button variant="default" fullWidth onClick={handleClick}>
      Load test data
    </Button>
  );
};
