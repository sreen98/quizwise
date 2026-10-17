import { Anchor, Box, Button, Card, Group, List, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { formatClock, formatSeconds } from '../../format';
import { useQuizStart } from '../../hooks/useQuizStart';
import type { QuizListItem } from '../../service/types';
import { useSessionStore } from '../../session/sessionStore';
import classes from './QuizStartPage.module.css';
import type { Country } from '../../types/models';

const KEEPS_RUNNING = 'keeps running if you refresh, switch tabs or close the window.';

const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1) ?? ''}`;

const countryNames = (quiz: QuizListItem, countries: Country[]) =>
  joinNames(quiz.countries.map(code => countries.find(country => country.code === code)?.name ?? code));

const questionTypes = (quiz: QuizListItem) => {
  if (quiz.questionTypes.length > 1) return 'Single and multiple choice';
  return quiz.questionTypes[0] === 'multiple' ? 'Multiple choice' : 'Single choice';
};

const timeLimit = ({ timeLimitSeconds, perQuestionSeconds }: QuizListItem): [string, string] => {
  if (timeLimitSeconds !== null) {
    const detail =
      perQuestionSeconds === null ? 'for the whole quiz' : `${formatSeconds(perQuestionSeconds)} per question`;
    return [formatClock(timeLimitSeconds), detail];
  }
  if (perQuestionSeconds !== null) return [formatClock(perQuestionSeconds), 'for each question'];
  return ['None', 'untimed'];
};

const timerRule = ({ timeLimitSeconds, perQuestionSeconds }: QuizListItem) => {
  if (timeLimitSeconds !== null && perQuestionSeconds !== null) {
    return `You have ${formatSeconds(timeLimitSeconds)} in total and ${formatSeconds(perQuestionSeconds)} per question. The timer starts when you press Start and ${KEEPS_RUNNING}`;
  }
  if (timeLimitSeconds !== null) {
    return `You have ${formatSeconds(timeLimitSeconds)}. The timer starts when you press Start and ${KEEPS_RUNNING}`;
  }
  if (perQuestionSeconds !== null) {
    return `Each question has ${formatSeconds(perQuestionSeconds)}. The timer starts when you press Start and ${KEEPS_RUNNING}`;
  }
  return 'There is no time limit, so take the time you need.';
};

const rules = (quiz: QuizListItem) => {
  const timed = quiz.timeLimitSeconds !== null || quiz.perQuestionSeconds !== null;
  return [
    timerRule(quiz),
    "You see one question at a time. Once you submit an answer you can't go back to it.",
    ...(timed ? ["If time runs out, whatever you've selected is submitted for you."] : []),
    quiz.retakesAllowed ? 'You can retake this quiz to improve your best score.' : 'This quiz can only be taken once.'
  ];
};

const placeholderRules = [
  `You have 3 min. The timer starts when you press Start and ${KEEPS_RUNNING}`,
  "You see one question at a time. Once you submit an answer you can't go back to it.",
  "If time runs out, whatever you've selected is submitted for you.",
  'This quiz can only be taken once.'
];

const stat = (label: string, value: ReactNode) => (
  <Box key={label} className={classes.stat} pt={16}>
    <Text component="dt" fz={13} fw={600} c="dimmed" mb={6}>
      {label}
    </Text>
    <Box component="dd" m={0}>
      {value}
    </Box>
  </Box>
);

const backLink = (
  <Anchor component={Link} to="/quizzes" fw={600} display="inline-block" mt={-10}>
    <Group gap={6} wrap="nowrap" mih={44}>
      <IconArrowLeft size={18} aria-hidden />
      All quizzes
    </Group>
  </Anchor>
);

export const QuizStartPage = () => {
  const { quizId = '' } = useParams();
  const userId = useSessionStore(state => state.userId);
  const { state, start, starting, hasStartFailed } = useQuizStart(quizId, userId);

  if (state.status === 'missing') {
    return (
      <Stack gap="sm" align="flex-start">
        <Title order={1}>Quiz not found</Title>
        <Text c="dimmed">This quiz doesn't exist or has been removed.</Text>
        <Anchor component={Link} to="/quizzes" fw={600} display="inline-block" lh="44px">
          Back to quizzes
        </Anchor>
      </Stack>
    );
  }

  if (state.status === 'ready') {
    const { quiz } = state;
    if (!quiz.retakesAllowed && quiz.completed && !quiz.inProgress && quiz.bestAttemptId) {
      return <Navigate to={`/attempts/${quiz.bestAttemptId}/results`} replace />;
    }
  }

  const quiz = state.status === 'ready' ? state.quiz : null;
  const countries = state.status === 'ready' ? state.countries : [];
  const [limitValue, limitDetail] = quiz ? timeLimit(quiz) : ['', ''];

  return (
    <Box maw={1120} mx="auto">
      {backLink}
      <Card
        component="section"
        aria-labelledby="quiz-title"
        aria-busy={!quiz}
        withBorder
        radius="lg"
        p={{ base: 24, sm: 32 }}
        mt={4}
      >
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 32, md: 48 }}>
          <Box>
            <Skeleton visible={!quiz} w="fit-content">
              <Text fz={14} fw={600} c="dimmed">
                Available in {quiz ? countryNames(quiz, countries) : 'loading'}
              </Text>
            </Skeleton>
            <Skeleton visible={!quiz} my={10}>
              <Title id="quiz-title" order={1} fz={{ base: 30, sm: 40 }} lh={1.1} lts="-0.01em">
                {quiz?.title ?? 'Loading quiz'}
              </Title>
            </Skeleton>
            <Skeleton visible={!quiz}>
              <Text c="dimmed" fz={18} lh={1.5}>
                {quiz?.description ?? 'Loading the description of this quiz, which says what it covers.'}
              </Text>
            </Skeleton>

            <SimpleGrid component="dl" cols={2} spacing={12} verticalSpacing={24} mt={32} mb={0}>
              {stat(
                'Questions',
                <Skeleton visible={!quiz}>
                  <Text ff="monospace" fz={22} fw={700}>
                    {quiz?.questionCount ?? 0}
                  </Text>
                </Skeleton>
              )}
              {stat(
                'Time limit',
                <Skeleton visible={!quiz}>
                  <Text ff="monospace" fz={22} fw={700}>
                    {limitValue || '0:00'}
                  </Text>
                  <Text fz={13} c="dimmed">
                    {limitDetail || 'loading'}
                  </Text>
                </Skeleton>
              )}
              {stat(
                'Attempts',
                <Skeleton visible={!quiz}>
                  <Text fz={20} fw={700}>
                    {quiz && !quiz.retakesAllowed ? 'One only' : 'Unlimited'}
                  </Text>
                </Skeleton>
              )}
              {stat(
                'Question types',
                <Skeleton visible={!quiz}>
                  <Text fz={16} fw={700} lh={1.3}>
                    {quiz ? questionTypes(quiz) : 'Single and multiple choice'}
                  </Text>
                </Skeleton>
              )}
            </SimpleGrid>
          </Box>

          <Box bg={{ base: 'transparent', md: 'var(--surface-2)' }} p={{ base: 0, md: 28 }} bdrs="md">
            <Title order={2} fz={17} mb={12}>
              Before you start
            </Title>
            <Skeleton visible={!quiz} mb={32}>
              <List c="dimmed" fz={15} spacing={10}>
                {(quiz ? rules(quiz) : placeholderRules).map((rule, index) => (
                  <List.Item key={`${String(index)}-${rule}`}>{rule}</List.Item>
                ))}
              </List>
            </Skeleton>

            {hasStartFailed && (
              <Text c="orange" fz={14} mb={12} role="alert">
                The quiz could not be started. Try again.
              </Text>
            )}

            <Group gap={12}>
              <Button h={52} px={28} disabled={!quiz} loading={starting} onClick={() => void start()}>
                {quiz?.inProgress ? 'Resume quiz' : 'Start quiz'}
              </Button>
              <Button component={Link} to="/quizzes" h={52} px={28} variant="subtle" color="gray">
                Not now
              </Button>
            </Group>
          </Box>
        </SimpleGrid>
      </Card>
    </Box>
  );
};
