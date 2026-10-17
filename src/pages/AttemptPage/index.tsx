import { Anchor, AppShell, Box, Button, Group, Kbd, Skeleton, Stack, Text, Title } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import type { SubmitEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { AttemptHeader } from '../../components/AttemptHeader';
import { QuestionView } from '../../components/QuestionView';
import { SegmentedProgress } from '../../components/SegmentedProgress';
import { useQuizAttempt } from '../../hooks/useQuizAttempt';
import classes from './AttemptPage.module.css';

export const AttemptPage = () => {
  const { attemptId = '' } = useParams();
  const { state, selection, select, submit, submitting } = useQuizAttempt(attemptId);
  const question = state.status === 'in_progress' ? state : null;
  const canSubmit = question !== null && selection.length > 0 && !submitting;

  useHotkeys([
    [
      'Enter',
      event => {
        if (!question || (event.target instanceof Element && event.target.closest('a'))) return;
        event.preventDefault();
        if (canSubmit) submit();
      },
      { preventDefault: false }
    ]
  ]);

  if (state.status === 'completed' || state.status === 'closed') {
    return <Navigate to={`/attempts/${attemptId}/results`} replace />;
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSubmit) submit();
  };

  return (
    <AppShell header={{ height: { base: 60, sm: 68 } }}>
      <AppShell.Header>
        <AttemptHeader quizTitle={question?.quizTitle ?? null} />
      </AppShell.Header>
      <AppShell.Main>
        <Box maw={1000} mx="auto" px={{ base: 16, sm: 24 }} pt={{ base: 20, sm: 36 }} pb={{ base: 112, sm: 48 }}>
          {state.status === 'missing' ? (
            <Stack gap="sm" align="flex-start">
              <Title order={1}>Attempt not found</Title>
              <Text c="dimmed">This attempt doesn't exist or has been removed.</Text>
              <Anchor component={Link} to="/quizzes" fw={600}>
                Back to quizzes
              </Anchor>
            </Stack>
          ) : (
            <form aria-busy={!question} onSubmit={handleSubmit}>
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
                <QuestionView question={question.question} value={selection} onChange={select} />
              ) : (
                <Skeleton h={360} radius="lg" />
              )}

              <Group className={classes.actions} justify="space-between" gap={16} mt={24}>
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
