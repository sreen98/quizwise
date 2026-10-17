import { ActionIcon, Button, Flex, Group, Skeleton, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconArrowLeft } from '@tabler/icons-react';
import { useEffect, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { AttemptHeaderProps } from './types';

const LEAVE_MODAL_ID = 'leave-quiz';

export const AttemptHeader = ({ quizTitle, timers, showExitConfirm }: AttemptHeaderProps) => {
  const navigate = useNavigate();

  useEffect(
    () => () => {
      modals.close(LEAVE_MODAL_ID);
    },
    []
  );

  const handleExit = (event: MouseEvent) => {
    if (!showExitConfirm) return;
    event.preventDefault();
    modals.openConfirmModal({
      modalId: LEAVE_MODAL_ID,
      title: 'Leave the quiz?',
      children: <Text size="sm">Your answers are saved, but the timer keeps running while you're away.</Text>,
      labels: { confirm: 'Save and exit', cancel: 'Keep going' },
      onConfirm: () => {
        void navigate('/quizzes');
      }
    });
  };

  return (
    <Group h="100%" pl={{ base: 4, sm: 12 }} pr={{ base: 8, sm: 24 }} gap={14} wrap="nowrap">
      <Button
        component={Link}
        to="/quizzes"
        onClick={handleExit}
        variant="subtle"
        color="gray"
        px={12}
        leftSection={<IconArrowLeft size={18} aria-hidden />}
        visibleFrom="sm"
      >
        Save and exit
      </Button>
      <ActionIcon
        component={Link}
        to="/quizzes"
        onClick={handleExit}
        variant="subtle"
        color="gray"
        size={44}
        aria-label="Save and exit"
        hiddenFrom="sm"
      >
        <IconArrowLeft size={20} aria-hidden />
      </ActionIcon>
      <Skeleton visible={quizTitle === null} w="auto" miw={0}>
        <Text fw={700} fz={{ base: 15, sm: 16 }} truncate>
          {quizTitle ?? 'Loading quiz'}
        </Text>
      </Skeleton>
      <Flex direction={{ base: 'column', sm: 'row' }} gap={{ base: 0, sm: 8 }} align="flex-end" ml="auto">
        {timers}
      </Flex>
    </Group>
  );
};
