import {
  Anchor,
  Badge,
  Box,
  Card,
  Divider,
  Flex,
  Group,
  Paper,
  RingProgress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { formatClock } from '../../format';
import { useAttemptResult } from '../../hooks/useAttemptResult';
import { useSessionStore } from '../../session/sessionStore';
import type { ResultDetails } from '../../service/types';
import classes from './ResultsPage.module.css';

const praiseFor = (percentage: number) => {
  if (percentage >= 80) return 'Nice work';
  if (percentage >= 50) return 'Good effort';
  return 'Keep practising';
};

const stat = (label: string, value: ReactNode) => (
  <Box key={label} className={classes.stat} pt={16}>
    <Text component="dt" fz={13} fw={600} c="dimmed" mb={6}>
      {label}
    </Text>
    <Box component="dd" m={0} fz={24} fw={700}>
      {value}
    </Box>
  </Box>
);

const summary = (result: ResultDetails) => (
  <Card component="section" aria-labelledby="result-title" withBorder radius="lg" p={{ base: 24, sm: 36 }}>
    <Flex direction={{ base: 'column', sm: 'row' }} align="center" gap={{ base: 24, sm: 36 }}>
      <RingProgress
        size={148}
        thickness={12}
        roundCaps
        rootColor="var(--mantine-color-default-border)"
        sections={[{ value: result.percentage, color: 'blue' }]}
        label={
          <Text ta="center" ff="monospace" fz={26} fw={700}>
            {result.percentage}%
          </Text>
        }
      />
      <Box flex={1} miw={0} w="100%">
        <Text fz={14} fw={600} c="dimmed">
          {result.endReason === 'timeout' ? 'Time ran out' : 'Quiz complete'}
        </Text>
        <Title id="result-title" order={1} fz={{ base: 28, sm: 34 }} lts="-0.01em" my={8}>
          {result.quizTitle}
        </Title>
        <Text c="dimmed" fz={17} mb={24}>
          {praiseFor(result.percentage)}, {result.userName.split(' ')[0]}. You scored {result.score} out of{' '}
          {result.totalQuestions}.
        </Text>
        <SimpleGrid component="dl" cols={{ base: 2, sm: 4, lg: 2, xl: 4 }} spacing={12} m={0}>
          {stat('Correct', result.correctCount)}
          {stat('Incorrect', result.incorrectCount)}
          {stat(
            'Time taken',
            <Text component="span" ff="monospace" inherit>
              {formatClock(result.timeTakenSeconds)}
            </Text>
          )}
          {stat(
            'Best rank',
            result.rank === null ? (
              'None'
            ) : (
              <>
                #{result.rank}{' '}
                <Text component="span" c="dimmed" fz={15} fw={600}>
                  of {result.rankedCount}
                </Text>
              </>
            )
          )}
        </SimpleGrid>
      </Box>
    </Flex>
  </Card>
);

const actionCard = (to: string, title: string, detail: string) => (
  <Paper
    component={Link}
    to={to}
    className={classes.action}
    withBorder
    radius="lg"
    px={20}
    py={18}
    c="var(--mantine-color-text)"
    td="none"
  >
    <Group justify="space-between" wrap="nowrap" gap={16}>
      <Box>
        <Text fw={700} fz={17}>
          {title}
        </Text>
        <Text c="dimmed" fz={14}>
          {detail}
        </Text>
      </Box>
      <IconArrowRight size={20} aria-hidden />
    </Group>
  </Paper>
);

const nextSteps = (result: ResultDetails) => (
  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={16}>
    {actionCard(
      `/leaderboard/${result.quizId}`,
      'See where you stand',
      result.rank === null
        ? 'Open the leaderboard'
        : `Best rank #${String(result.rank)} of ${String(result.rankedCount)}`
    )}
    {result.retakesAllowed ? (
      actionCard(
        `/quizzes/${result.quizId}`,
        'Try again',
        result.best
          ? `Beat your best score of ${String(result.best.score)}/${String(result.best.totalQuestions)}`
          : 'Start a new attempt'
      )
    ) : (
      <Paper withBorder radius="lg" bg="var(--surface-2)" px={20} py={18}>
        <Badge mb={6}>Already completed</Badge>
        <Text fz={14} c="dimmed">
          This quiz allows one attempt, so this is your final result.
        </Text>
      </Paper>
    )}
  </SimpleGrid>
);

const backLink = (
  <Anchor component={Link} to="/quizzes" fw={600} display="inline-block" mt={-10}>
    <Group gap={6} wrap="nowrap" mih={44}>
      <IconArrowLeft size={18} aria-hidden />
      All quizzes
    </Group>
  </Anchor>
);

const breakdown = (result: ResultDetails) => (
  <Card component="section" aria-labelledby="breakdown-title" withBorder radius="lg" px={{ base: 20, sm: 32 }} py={28}>
    <Title id="breakdown-title" order={2} fz={18} mb={8}>
      Question by question
    </Title>
    {result.breakdown ? (
      <Box component="ol" m={0} p={0}>
        {result.breakdown.map((item, index, items) => (
          <Box component="li" key={item.questionId} display="block">
            {index > 0 && <Divider />}
            <Group gap={14} py={14} wrap="nowrap" align="flex-start">
              <Text ff="monospace" c="dimmed" fw={700} w={`${String(String(items.length).length + 1)}ch`}>
                {index + 1}
              </Text>
              <Text flex={1}>{item.text}</Text>
              <Badge color={item.isCorrect ? 'blue' : 'orange'}>{item.isCorrect ? 'Correct' : 'Incorrect'}</Badge>
            </Group>
          </Box>
        ))}
      </Box>
    ) : (
      <Text c="dimmed" fz={15}>
        This quiz has changed since your attempt, so the question breakdown isn't shown.
      </Text>
    )}
  </Card>
);

export const ResultsPage = () => {
  const { attemptId = '' } = useParams();
  const userId = useSessionStore(state => state.userId);
  const state = useAttemptResult(attemptId, userId);

  if (state.status === 'in_progress') return <Navigate to={`/attempts/${attemptId}`} replace />;

  if (state.status === 'missing') {
    return (
      <Stack gap="sm" align="flex-start">
        <Title order={1}>Result not found</Title>
        <Text c="dimmed">This result doesn't exist or its quiz has been removed.</Text>
        <Anchor component={Link} to="/quizzes" fw={600} display="inline-block" lh="44px">
          Back to quizzes
        </Anchor>
      </Stack>
    );
  }

  if (state.status === 'loading') {
    return (
      <SimpleGrid maw={{ base: 920, lg: 1280 }} mx="auto" cols={{ base: 1, lg: 2 }} spacing={24}>
        <Stack gap={24}>
          <Skeleton h={240} radius="lg" />
          <Skeleton h={84} radius="lg" />
        </Stack>
        <Skeleton h={320} radius="lg" />
      </SimpleGrid>
    );
  }

  return (
    <Stack maw={{ base: 920, lg: 1280 }} mx="auto" gap={20}>
      <Box>{backLink}</Box>
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing={20}>
        <Stack gap={20} className={classes.side}>
          {summary(state)}
          {nextSteps(state)}
        </Stack>
        {breakdown(state)}
      </SimpleGrid>
    </Stack>
  );
};
