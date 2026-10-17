import { ActionIcon, Button, Flex, Group, Skeleton, Text } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Link } from 'react-router';
import type { AttemptHeaderProps } from './types';

export const AttemptHeader = ({ quizTitle, timers }: AttemptHeaderProps) => {
  return (
    <Group h="100%" pl={{ base: 4, sm: 12 }} pr={{ base: 8, sm: 24 }} gap={14} wrap="nowrap">
      <Button
        component={Link}
        to="/quizzes"
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
