import { Anchor, Box, Button, Card, Flex, Group, Skeleton, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router';
import { formatClock, formatDateTime, formatSeconds } from '../../format';
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
  <Group key={label} className={classes.stat} justify="space-between" py={14} fz={15}>
    <Text component="dt" c="dimmed" fw={600} inherit>
      {label}
    </Text>
    <Box component="dd" m={0} fw={700}>
      {value}
    </Box>
  </Group>
);

const message = (title: string, body: ReactNode, actions: ReactNode) => (
  <Stack gap={16}>
    <Card component="section" aria-labelledby="ended-title" withBorder radius="lg" p={{ base: 22, sm: 32 }}>
      <Title ref={focusOnMount} id="ended-title" tabIndex={-1} order={1} fz={{ base: 24, sm: 28 }} lh={1.25} mb={10}>
        {title}
      </Title>
      {body}
    </Card>
    <Flex direction={{ base: 'column', sm: 'row' }} gap={10}>
      {actions}
    </Flex>
  </Stack>
);

const backButton = (primary: boolean) => (
  <Button component={Link} to="/quizzes" variant={primary ? 'filled' : 'default'} h={48}>
    Back to quizzes
  </Button>
);

const timeoutMessage = (attempt: EndedAttempt, isEndedWhileAway: boolean) =>
  message(
    isEndedWhileAway ? 'Time ran out while you were away' : 'Time ran out',
    <>
      <Text c="dimmed" fz={15} lh={1.55} mb={20}>
        You started {attempt.quizTitle} {formatDateTime(attempt.startedAt)}. {limitSentence(attempt)}, so the attempt
        was finished with the answers you'd already given. Questions you didn't reach count as incorrect.
      </Text>
      <Box component="dl" m={0}>
        {stat('Answered', `${String(attempt.answeredCount)} of ${String(attempt.totalQuestions)}`)}
        {stat(
          'Score',
          `${String(attempt.score ?? 0)} / ${String(attempt.totalQuestions)} · ${String(attempt.percentage ?? 0)}%`
        )}
        {stat(
          'Time used',
          <Text component="span" ff="monospace" inherit>
            {formatClock(attempt.timeTakenSeconds ?? 0)}
          </Text>
        )}
      </Box>
    </>,
    <>
      <Button component={Link} to={`/attempts/${attempt.attemptId}/results`} h={48}>
        See results
      </Button>
      {backButton(false)}
    </>
  );

const changedMessage = (attempt: EndedAttempt) => {
  const best =
    attempt.bestResult && `${String(attempt.bestResult.score)} / ${String(attempt.bestResult.totalQuestions)}`;

  return message(
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
    <>
      {attempt.canStartAgain && (
        <Button component={Link} to={`/quizzes/${attempt.quizId}`} h={48}>
          Start the new version
        </Button>
      )}
      {backButton(!attempt.canStartAgain)}
    </>
  );
};

const deletedMessage = message(
  'This quiz is no longer available',
  <Text c="dimmed" fz={15} lh={1.55}>
    It was removed by an admin while you were taking it. Your progress wasn't scored and nothing was added to the
    leaderboard.
  </Text>,
  backButton(true)
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
      <Box maw={640} mx="auto">
        <Skeleton h={260} radius="lg" />
      </Box>
    );
  }

  const { attempt } = state;
  if (attempt.endReason === 'submitted') return <Navigate to={`/attempts/${attempt.attemptId}/results`} replace />;

  return (
    <Box maw={640} mx="auto">
      {attempt.endReason === 'timeout' && timeoutMessage(attempt, isEndedWhileAway)}
      {attempt.endReason === 'quiz_changed' && changedMessage(attempt)}
      {attempt.endReason === 'quiz_deleted' && deletedMessage}
    </Box>
  );
};
