import {
  Anchor,
  AppShell,
  Box,
  Button,
  Group,
  Kbd,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
  VisuallyHidden
} from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import type { SubmitEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { AttemptHeader } from '../../components/AttemptHeader';
import { QuestionView } from '../../components/QuestionView';
import { SegmentedProgress } from '../../components/SegmentedProgress';
import { TimerBadge } from '../../components/TimerBadge';
import type { TimerScope } from '../../components/TimerBadge/types';
import { formatClock } from '../../format';
import { isWarning } from '../../hooks/useCountdown';
import { useQuizAttempt } from '../../hooks/useQuizAttempt';
import { useSessionStore } from '../../session/sessionStore';
import type { QuestionInProgress } from '../../service/types';
import classes from './AttemptPage.module.css';

interface Timer {
  scope: TimerScope;
  deadlineAt: number;
  limitSeconds: number;
}

const timersFor = (question: QuestionInProgress) => {
  const timers: Timer[] = [];
  if (question.overallDeadlineAt !== null && question.timeLimitSeconds !== null) {
    timers.push({ scope: 'quiz', deadlineAt: question.overallDeadlineAt, limitSeconds: question.timeLimitSeconds });
  }
  if (question.questionDeadlineAt !== null && question.perQuestionSeconds !== null) {
    timers.push({
      scope: 'question',
      deadlineAt: question.questionDeadlineAt,
      limitSeconds: question.perQuestionSeconds
    });
  }
  return timers;
};

export const AttemptPage = () => {
  const { attemptId = '' } = useParams();
  const userId = useSessionStore(state => state.userId);
  const { state, isEndedWhileAway, selection, select, submit, submitting, now, announcement } = useQuizAttempt(
    attemptId,
    userId
  );
  const question = state.status === 'in_progress' ? state : null;
  const timers = question ? timersFor(question) : [];
  const urgent = timers.find(timer => timer.deadlineAt === question?.deadlineAt);
  const remainingFor = (timer: Timer) => Math.max(0, timer.deadlineAt - now);
  const showWarning = urgent !== undefined && isWarning(remainingFor(urgent), urgent.limitSeconds);
  const canSubmit = question !== null && selection.length > 0 && !submitting;

  useHotkeys([
    [
      'Enter',
      event => {
        if (!question || (event.target instanceof Element && event.target.closest('a, [role="dialog"]'))) return;
        event.preventDefault();
        if (canSubmit) submit();
      },
      { preventDefault: false }
    ]
  ]);

  if (state.status === 'completed' && state.endReason === 'submitted') {
    return <Navigate to={`/attempts/${attemptId}/results`} replace />;
  }

  if (state.status === 'completed' || state.status === 'closed') {
    return <Navigate to={`/attempts/${attemptId}/ended`} replace state={{ isEndedWhileAway }} />;
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSubmit) submit();
  };

  return (
    <AppShell header={{ height: { base: 60, sm: 68 } }}>
      <AppShell.Header>
        <AttemptHeader
          quizTitle={question?.quizTitle ?? null}
          showExitConfirm={timers.length > 0}
          timers={timers.map(timer => (
            <TimerBadge
              key={timer.scope}
              scope={timer.scope}
              remainingMs={remainingFor(timer)}
              limitSeconds={timer.limitSeconds}
              showShortLabel={timers.length > 1}
            />
          ))}
        />
      </AppShell.Header>
      <AppShell.Main>
        <VisuallyHidden aria-live="assertive">
          {announcement && `${announcement}. Your selection will be submitted automatically when time runs out.`}
        </VisuallyHidden>
        <Box maw={1000} mx="auto" px={{ base: 16, sm: 24 }} pt={{ base: 20, sm: 36 }} pb={{ base: 112, sm: 48 }}>
          {state.status === 'missing' ? (
            <Stack gap="sm" align="flex-start">
              <Title order={1}>Attempt not found</Title>
              <Text c="dimmed">This attempt doesn't exist or has been removed.</Text>
              <Anchor component={Link} to="/quizzes" fw={600} display="inline-block" lh="44px">
                Back to quizzes
              </Anchor>
            </Stack>
          ) : (
            <form aria-busy={!question} onSubmit={handleSubmit}>
              {showWarning && (
                <Paper hiddenFrom="sm" bg="var(--warn-soft)" c="var(--warn)" radius="md" px={14} py={12} mb={16}>
                  <Text fz={15} fw={700} c="inherit">
                    <Text component="span" ff="monospace" inherit>
                      {formatClock(Math.ceil(remainingFor(urgent) / 1000))}
                    </Text>{' '}
                    {urgent.scope === 'question' ? 'left on this question' : 'left in this quiz'}
                  </Text>
                  <Text fz={13} fw={500} c="inherit">
                    Your selection is submitted when time runs out.
                  </Text>
                </Paper>
              )}
              <Group justify="space-between" align="baseline" mb={12}>
                <Skeleton visible={!question} w="fit-content">
                  <Text fw={700} fz={15}>
                    Question {question ? question.index + 1 : 1} of {question?.total ?? 1}
                  </Text>
                </Skeleton>
                <Skeleton visible={!question} w="fit-content">
                  <Text c="dimmed" fz={14}>
                    {question?.index ?? 0} answered
                  </Text>
                </Skeleton>
              </Group>
              <Box mb={{ base: 20, sm: 32 }}>
                {question ? <SegmentedProgress total={question.total} answered={question.index} /> : <Skeleton h={6} />}
              </Box>

              {question ? (
                <QuestionView
                  key={question.question.id}
                  question={question.question}
                  value={selection}
                  onChange={select}
                  disabled={submitting}
                />
              ) : (
                <Skeleton h={360} radius="lg" />
              )}

              <Group className={classes.actions} justify="space-between" gap={16} mt={{ base: 0, sm: 24 }}>
                <Text c="dimmed" fz={14} visibleFrom="sm">
                  Tab and Space to select · <Kbd>Enter</Kbd> to submit
                </Text>
                <Button
                  type="submit"
                  h={52}
                  px={28}
                  fz={16}
                  w={{ base: '100%', sm: 'auto' }}
                  disabled={selection.length === 0}
                  loading={submitting}
                >
                  Submit answer
                </Button>
              </Group>
            </form>
          )}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};
