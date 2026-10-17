import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useEffect } from 'react';
import { useBlocker } from 'react-router';

const LEAVE_MODAL_ID = 'leave-unsaved';

export const useUnsavedChangesPrompt = (hasChanges: boolean) => {
  const blocker = useBlocker(hasChanges);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    let isLeaving = false;
    modals.openConfirmModal({
      modalId: LEAVE_MODAL_ID,
      title: 'Leave without saving?',
      children: <Text size="sm">Your changes to this quiz will be lost.</Text>,
      labels: { confirm: 'Leave', cancel: 'Keep editing' },
      confirmProps: { color: 'orange' },
      onConfirm: () => {
        isLeaving = true;
        blocker.proceed();
      },
      onClose: () => {
        if (!isLeaving) blocker.reset();
      }
    });
  }, [blocker]);

  useEffect(
    () => () => {
      modals.close(LEAVE_MODAL_ID);
    },
    []
  );

  useEffect(() => {
    if (!hasChanges) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);
};
