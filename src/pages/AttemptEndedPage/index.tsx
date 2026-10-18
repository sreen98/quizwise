import { Box, Button, SimpleGrid, Skeleton, Stack, Text } from '@mantine/core';
import { IconFileOff, IconHourglassEmpty, IconRefresh, IconTrashX } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router';
import { MessageCard } from '../../components/MessageCard';
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

const stat = (label: string, value: ReactNode) => (
  <Box key={label} className={classes.stat} pt={14}>
    <Text component="dt" fz={13} c="dimmed" fw={600} mb={4}>
      {label}
    </Text>
    <Box component="dd" m={0} c="bright" fz={{ base: 16, sm: 18 }} fw={700}>
      {value}
    </Box>
  </Box>
);

const message = (
  icon: ReactNode,
  color: 'blue' | 'orange',
  title: string,
  body: ReactNode,
  primaryAction?: ReactNode
) => (
  <MessageCard
    icon={icon}
    color={color}
    title={title}
    actions={
      <>
        {primaryAction}
        <Button component={Link} to="/quizzes" variant="default" size="md">
          Back to quizzes
        </Button>
      </>
    }
  >
    {body}
  </MessageCard>
);

const timeoutMessage = (attempt: EndedAttempt, isEndedWhileAway: boolean) =>
  message(
    <IconHourglassEmpty size={38} />,
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
    <IconRefresh size={38} />,
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
  <IconTrashX size={38} />,
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
      <MessageCard
        icon={<IconFileOff size={38} />}
        title="Attempt not found"
        actions={
          <Button component={Link} to="/quizzes" size="md">
            Back to quizzes
          </Button>
        }
      >
        This attempt doesn't exist or has been removed.
      </MessageCard>
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
  if (attempt.endReason === 'timeout') return timeoutMessage(attempt, isEndedWhileAway);
  if (attempt.endReason === 'quiz_changed') return changedMessage(attempt);
  if (attempt.endReason === 'quiz_deleted') return deletedMessage;
  return <Navigate to={`/attempts/${attempt.attemptId}/results`} replace />;
};
