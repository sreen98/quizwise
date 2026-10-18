import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { useSessionStore } from '../session/sessionStore';

const LEAVE_MODAL_ID = 'leave-unsaved';

export const useUnsavedChangesPrompt = (hasChanges: boolean) => {
  const blocker = useBlocker(hasChanges);
  const setHasUnsavedChanges = useSessionStore(state => state.setHasUnsavedChanges);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    let isLeaving = false;
    modals.openConfirmModal({
      modalId: LEAVE_MODAL_ID,
      title: 'Leave without saving?',
      children: <Text size="sm">Your changes to this quiz will be lost.</Text>,
      labels: { confirm: 'Yes', cancel: 'Cancel' },
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
    setHasUnsavedChanges(hasChanges);
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [hasChanges, setHasUnsavedChanges]);

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
