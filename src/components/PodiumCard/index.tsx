import { Avatar, Badge, Box, Flex, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { formatClock, formatDate, formatScore } from '../../format';
import { Flag } from '../Flag';
import classes from './PodiumCard.module.css';
import type { PodiumCardProps } from './types';

const places = ['1st', '2nd', '3rd'];

export const PodiumCard = ({ entry, isMe }: PodiumCardProps) => {
  const isFirst = entry.rank === 1;
  const stats = [
    { label: 'Accuracy', value: `${String(entry.percentage)}%` },
    { label: 'Time', value: formatClock(entry.timeTakenSeconds) },
    { label: 'Completed', value: entry.completedAt ? formatDate(entry.completedAt) : '' }
  ];

  return (
    <Paper
      component="li"
      display="block"
      radius="lg"
      withBorder
      bg={isMe ? 'var(--accent-soft)' : undefined}
      aria-current={isMe || undefined}
    >
      <Stack align="center" gap={0} px={{ base: 16, sm: 20 }} pt={{ base: 22, sm: 28 }} pb={{ base: 18, sm: 22 }}>
        <Box pos="relative">
          <Avatar aria-hidden name={entry.userName} color="blue" variant="light" size={72} />
          <Flex
            pos="absolute"
            right={-6}
            bottom={-2}
            w={32}
            h={32}
            align="center"
            justify="center"
            bdrs="50%"
            fz={11}
            fw={700}
            bg={isFirst ? 'blue' : 'var(--mantine-color-blue-light)'}
            c={isFirst ? 'var(--filled-ink)' : 'var(--mantine-color-blue-light-color)'}
            bd="2px solid var(--surface)"
          >
            {places[entry.rank - 1]}
          </Flex>
        </Box>
        <Group gap={8} wrap="nowrap" justify="center" mt={14} maw="100%">
          <Text fw={700} fz={18} truncate>
            {entry.userName}
          </Text>
          {isMe && (
            <Badge variant="filled" size="xs">
              You
            </Badge>
          )}
        </Group>
        <Group gap={6} wrap="nowrap" mt={4}>
          <Flag code={entry.country} />
          <Text fz={14} c="dimmed">
            {entry.countryName}
          </Text>
        </Group>
        <Badge variant="light" size="xl" radius="xl" tt="none" fz={15} mt={16}>
          {formatScore(entry.score, entry.totalQuestions)} correct
        </Badge>
      </Stack>
      <SimpleGrid cols={3} spacing={0} className={classes.stats}>
        {stats.map(stat => (
          <Box key={stat.label} className={classes.stat} py={12} px={{ base: 4, sm: 8 }} ta="center">
            <Text fz={12} c="dimmed">
              {stat.label}
            </Text>
            <Text ff={stat.label === 'Completed' ? undefined : 'monospace'} fz={{ base: 14, sm: 15 }} fw={700} truncate>
              {stat.value}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Paper>
  );
};
