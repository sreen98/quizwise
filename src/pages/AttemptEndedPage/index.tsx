import { Anchor, Box, Button, Card, Group, SimpleGrid, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconHourglassEmpty, IconRefresh, IconTrashX } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router';
import { formatClock, formatDateTime, formatScore, formatSeconds } from '../../format';
import { useEndedAttempt } from '../../hooks/useEndedAttempt';
import { useSessionStore } from '../../session/sessionStore';
import type { EndedAttempt } from '../../service/types';
import classes from './AttemptEndedPage.module.css';

const limitSentence = ({ timeLimitSeconds, perQuestionSeconds }: EndedAttempt) => {
  if (timeLimitSeconds !== null && perQuestionSeconds !== null) {
    return `It has a ${formatSeconds(timeLimitSeconds)} limit and ${formatSeconds(perQuestionSeconds)} per question`;
  }
  if (timeLimitSeconds !== null) return `It has a ${formatSeconds(timeLimitSeconds)} limit`;
  if (perQuestionSeconds !== null) return `It allows ${formatSeconds(perQuestionSeconds)} per question`;
  return 'Its time ran out';
};

const isPresentState = (state: unknown) =>
  typeof state === 'object' && state !== null && 'isEndedWhileAway' in state && state.isEndedWhileAway === false;

const focusOnMount = (heading: HTMLHeadingElement | null) => {
  heading?.focus();
};

const stat = (label: string, value: ReactNode) => (
  <Box key={label} className={classes.stat} pt={14}>
    <Text component="dt" fz={13} c="dimmed" fw={600} mb={4}>
      {label}
    </Text>
    <Box component="dd" m={0} fz={{ base: 16, sm: 18 }} fw={700}>
      {value}
    </Box>
  </Box>
);

const message = (icon: ReactNode, color: string, title: string, body: ReactNode, primaryAction?: ReactNode) => (
  <Stack gap={16}>
    <Card
      component="section"
      aria-labelledby="ended-title"
      withBorder
      radius="lg"
      px={{ base: 22, sm: 32 }}
      py={{ base: 32, sm: 48 }}
    >
      <title>{`${title} - Quizwise`}</title>
      <ThemeIcon variant="light" color={color} size={64} radius="xl" display="flex" mx="auto" mb={18} aria-hidden>
        {icon}
      </ThemeIcon>
      <Title ref={focusOnMount} id="ended-title" tabIndex={-1} order={1} fz={{ base: 24, sm: 28 }} lh={1.25} mb={10}>
        {title}
      </Title>
      {body}
    </Card>
    <Group justify="space-between" gap={10}>
      <Button component={Link} to="/quizzes" variant="default">
        Back to quizzes
      </Button>
      {primaryAction}
    </Group>
  </Stack>
);

const timeoutMessage = (attempt: EndedAttempt, isEndedWhileAway: boolean) =>
  message(
    <IconHourglassEmpty size={34} />,
    'orange',
    isEndedWhileAway ? 'Time ran out while you were away' : 'Time ran out',
    <>
      <Text c="dimmed" fz={15} lh={1.55} mb={20}>
        You started {attempt.quizTitle} {formatDateTime(attempt.startedAt)}. {limitSentence(attempt)}, so the attempt
        was finished with the answers you'd already given. Questions you didn't reach count as incorrect.
      </Text>
      <SimpleGrid component="dl" cols={3} spacing={16} mt={8} mb={0}>
        {stat('Answered', `${String(attempt.answeredCount)} of ${String(attempt.totalQuestions)}`)}
        {stat(
          'Score',
          `${formatScore(attempt.score ?? 0, attempt.totalQuestions)} · ${String(attempt.percentage ?? 0)}%`
        )}
        {stat(
          'Time used',
          <Text component="span" ff="monospace" inherit>
            {formatClock(attempt.timeTakenSeconds ?? 0)}
          </Text>
        )}
      </SimpleGrid>
    </>,
    <Button component={Link} to={`/attempts/${attempt.attemptId}/results`}>
      See results
    </Button>
  );

const changedMessage = (attempt: EndedAttempt) => {
  const best =
    attempt.bestResult && `${String(attempt.bestResult.score)} / ${String(attempt.bestResult.totalQuestions)}`;

  return message(
    <IconRefresh size={34} />,
    'blue',
    'This quiz was updated',
    <Stack gap={14}>
      <Text c="dimmed" fz={15} lh={1.55}>
        An admin changed {attempt.quizTitle} after you started it. Your answers were for the old questions, so this
        attempt has been closed and won't be scored.
      </Text>
      {(attempt.canStartAgain || best) && (
        <Text c="dimmed" fz={15} lh={1.55}>
          {attempt.canStartAgain && 'You can start again on the new version. '}
          {best && `Your earlier best score of ${best} still stands.`}
        </Text>
      )}
    </Stack>,
    attempt.canStartAgain && (
      <Button component={Link} to={`/quizzes/${attempt.quizId}`}>
        Start the new version
      </Button>
    )
  );
};

const deletedMessage = message(
  <IconTrashX size={34} />,
  'orange',
  'This quiz is no longer available',
  <Text c="dimmed" fz={15} lh={1.55}>
    It was removed by an admin while you were taking it. Your progress wasn't scored and nothing was added to the
    leaderboard.
  </Text>
);

export const AttemptEndedPage = () => {
  const { attemptId = '' } = useParams();
  const location = useLocation();
  const userId = useSessionStore(state => state.userId);
  const state = useEndedAttempt(attemptId, userId);
  const isEndedWhileAway = !isPresentState(location.state);

  if (state.status === 'missing') {
    return (
      <Stack gap="sm" align="flex-start">
        <title>Attempt not found - Quizwise</title>
        <Title order={1}>Attempt not found</Title>
        <Text c="dimmed">This attempt doesn't exist or has been removed.</Text>
        <Anchor component={Link} to="/quizzes" fw={600} display="inline-block" lh="44px">
          Back to quizzes
        </Anchor>
      </Stack>
    );
  }

  if (state.status === 'loading') {
    return (
      <Box maw={520} mx="auto">
        <Skeleton h={260} radius="lg" />
      </Box>
    );
  }

  const { attempt } = state;
  if (attempt.endReason === 'submitted') return <Navigate to={`/attempts/${attempt.attemptId}/results`} replace />;

  return (
    <Box maw={520} mx="auto">
      {attempt.endReason === 'timeout' && timeoutMessage(attempt, isEndedWhileAway)}
      {attempt.endReason === 'quiz_changed' && changedMessage(attempt)}
      {attempt.endReason === 'quiz_deleted' && deletedMessage}
    </Box>
  );
};
