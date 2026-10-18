import { Anchor, Badge, Box, Button, Card, Group, RingProgress, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatCount, formatDateTime, formatTimerShort } from '../../format';
import type { QuizListItem } from '../../service/types';
import { CountryFlags } from '../CountryFlags';
import classes from './QuizCard.module.css';
import type { QuizCardProps } from './types';

const statusBadge = (quiz: QuizListItem) => {
  if (quiz.inProgress)
    return (
      <Badge color="orange" w="fit-content">
        In progress
      </Badge>
    );
  if (quiz.completed)
    return (
      <Badge color="blue" w="fit-content">
        Completed
      </Badge>
    );
  return null;
};

const meta = (quiz: QuizListItem) =>
  [
    formatCount(quiz.questionCount, 'question'),
    formatTimerShort(quiz.timeLimitSeconds, quiz.perQuestionSeconds) ?? 'No time limit',
    quiz.retakesAllowed ? 'Unlimited attempts' : 'Only once'
  ].join(' · ');

const dial = (value: number, color: string, label: ReactNode, name: string) => (
  <RingProgress
    size={72}
    thickness={7}
    roundCaps
    rootColor="var(--mantine-color-default-border)"
    sections={[{ value, color }]}
    label={
      <Text ta="center" ff="monospace" fz={14} fw={700} aria-label={name}>
        {label}
      </Text>
    }
  />
);

const summary = (quiz: QuizListItem) => {
  if (quiz.inProgress) {
    const answered = quiz.inProgress.answeredCount;
    return (
      <Group gap={14} wrap="nowrap">
        {dial(
          (answered / quiz.questionCount) * 100,
          'orange',
          `${String(answered)}/${String(quiz.questionCount)}`,
          `${String(answered)} of ${String(quiz.questionCount)} answered`
        )}
        <Box>
          <Text fw={700} fz={16}>
            {quiz.questionCount - answered} left
          </Text>
          <Text c="dimmed" fz={14}>
            Started {formatDateTime(quiz.inProgress.startedAt)}
          </Text>
        </Box>
      </Group>
    );
  }

  if (quiz.completed) {
    const percentage = Math.round(quiz.bestPercentage ?? 0);
    return (
      <Group gap={14} wrap="nowrap">
        {dial(percentage, 'blue', `${String(percentage)}%`, `Best score ${String(percentage)}%`)}
        <Box>
          <Text fw={700} fz={16}>
            {quiz.bestScore ?? 0} / {quiz.questionCount} correct
          </Text>
          {quiz.rank !== null && (
            <Anchor component={Link} to={`/leaderboard/${quiz.id}`} fz={14} fw={600}>
              Rank #{quiz.rank} of {quiz.rankedCount}
            </Anchor>
          )}
        </Box>
      </Group>
    );
  }

  return (
    <Text fz={13} fw={600}>
      {meta(quiz)}
    </Text>
  );
};

const action = (quiz: QuizListItem) => {
  if (quiz.inProgress) {
    return (
      <Button component={Link} to={`/attempts/${quiz.inProgress.attemptId}`} variant="light" color="orange">
        Resume
      </Button>
    );
  }
  if (!quiz.completed) {
    return (
      <Button component={Link} to={`/quizzes/${quiz.id}`}>
        Start
      </Button>
    );
  }
  if (quiz.retakesAllowed) {
    return (
      <Button component={Link} to={`/quizzes/${quiz.id}`} variant="default">
        Retake
      </Button>
    );
  }
  return (
    <Button component={Link} to={`/attempts/${quiz.bestAttemptId ?? ''}/results`} variant="default">
      View result
    </Button>
  );
};

export const QuizCard = ({ quiz, countries }: QuizCardProps) => {
  return (
    <Card component="article" withBorder radius="lg" p={{ base: 16, sm: 20 }} h="100%" className={classes.card}>
      <Stack gap={14} h="100%">
        <Group justify="space-between" align="flex-start" gap={12} wrap="nowrap">
          <Title order={2} fz={20} lineClamp={2}>
            {quiz.title}
          </Title>
          <CountryFlags codes={quiz.countries} countries={countries} />
        </Group>
        {statusBadge(quiz)}
        {!quiz.inProgress && !quiz.completed && (
          <Text c="dimmed" fz={15} lh={1.5} lineClamp={2}>
            {quiz.description}
          </Text>
        )}
        <Group justify="space-between" align="center" gap={12} wrap="nowrap" mt="auto">
          <Box flex={1} miw={0}>
            {summary(quiz)}
          </Box>
          {action(quiz)}
        </Group>
      </Stack>
    </Card>
  );
};
