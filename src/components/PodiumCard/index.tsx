import { Avatar, Badge, Box, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { formatClock, formatDateTime, formatScore } from '../../format';
import classes from './PodiumCard.module.css';
import type { PodiumCardProps } from './types';

const places = ['1st', '2nd', '3rd'];

export const PodiumCard = ({ entry, isMe }: PodiumCardProps) => {
  const isFirst = entry.rank === 1;

  return (
    <Paper
      component="li"
      className={classes.place}
      data-place={entry.rank}
      display="block"
      radius="lg"
      withBorder={!isFirst}
      bd={isFirst ? '2px solid var(--mantine-primary-color-filled)' : undefined}
      bg={isMe ? 'var(--accent-soft)' : undefined}
      px={{ base: 18, sm: 22 }}
      py={{ base: 18, sm: isFirst ? 30 : 22 }}
      aria-current={isMe || undefined}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb={14}>
        <Stack gap={4} align="center">
          <Avatar
            aria-hidden
            name={entry.userName}
            color="blue"
            variant={isFirst ? 'filled' : 'light'}
            size={isFirst ? 60 : 48}
          />
          <Badge size="sm" variant={isFirst ? 'filled' : 'light'}>
            {places[entry.rank - 1]}
          </Badge>
        </Stack>
        <Group gap={6} justify="flex-end">
          {isMe && (
            <Badge variant="filled" size="xs">
              You
            </Badge>
          )}
          <Badge variant="default">{entry.countryName}</Badge>
        </Group>
      </Group>
      <Text fw={700} fz={isFirst ? 22 : 18} truncate>
        {entry.userName}
      </Text>
      <Paper bg="var(--surface-2)" radius="md" p={14} mt={14}>
        <SimpleGrid cols={2} spacing={12}>
          <Box>
            <Text fz={12} c="dimmed">
              Score (accuracy)
            </Text>
            <Text ff="monospace" fz={isFirst ? 28 : 22} fw={700} lh={1.2}>
              {formatScore(entry.score, entry.totalQuestions)}{' '}
              <Text component="span" fz={13} c="dimmed" ff="var(--mantine-font-family)" fw={500}>
                / {entry.percentage}%
              </Text>
            </Text>
          </Box>
          <Box>
            <Text fz={12} c="dimmed">
              Time taken
            </Text>
            <Text ff="monospace" fz={isFirst ? 22 : 18} fw={700} lh={1.4}>
              {formatClock(entry.timeTakenSeconds)}
            </Text>
          </Box>
        </SimpleGrid>
      </Paper>
      <Text fz={13} c="dimmed" mt={14}>
        {entry.completedAt ? `Completed ${formatDateTime(entry.completedAt)}` : ''}
      </Text>
    </Paper>
  );
};
