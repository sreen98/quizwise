import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title
} from '@mantine/core';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatDateTime, formatTimeLimits } from '../../format';
import type { QuizListItem } from '../../service/types';
import type { Country } from '../../types/models';
import classes from './QuizCard.module.css';
import type { QuizCardProps } from './types';

const statusBadge = (quiz: QuizListItem) => {
  if (quiz.inProgress) {
    return (
      <Badge color="orange">
        In progress · {quiz.inProgress.answeredCount} of {quiz.questionCount} answered
      </Badge>
    );
  }
  if (quiz.completed) return <Badge color="blue">Completed · {Math.round(quiz.bestPercentage ?? 0)}%</Badge>;
  return <Badge variant="default">Not started</Badge>;
};

const progressBar = (quiz: QuizListItem) => {
  if (quiz.inProgress) {
    const answered = quiz.inProgress.answeredCount;
    return (
      <Progress
        value={(answered / quiz.questionCount) * 100}
        color="orange"
        size={6}
        radius="lg"
        aria-label={`${String(answered)} of ${String(quiz.questionCount)} questions answered`}
      />
    );
  }
  if (quiz.completed) {
    const percentage = quiz.bestPercentage ?? 0;
    return (
      <Progress
        value={percentage}
        color="blue"
        size={6}
        radius="lg"
        aria-label={`Best score ${String(Math.round(percentage))}%`}
      />
    );
  }
  return null;
};

const availability = (quiz: QuizListItem, countries: Country[]) => {
  const [onlyCountry] = quiz.countries;
  if (quiz.countries.length === 1 && onlyCountry) {
    const name = countries.find(country => country.code === onlyCountry)?.name ?? onlyCountry;
    return `${name} only`;
  }
  return `Available in ${String(quiz.countries.length)} countries`;
};

const detail = (label: string, value: ReactNode) => (
  <Box key={label} miw={0}>
    <Text component="dt" fz={12} fw={600} c="dimmed" mb={2}>
      {label}
    </Text>
    <Box component="dd" m={0}>
      {value}
    </Box>
  </Box>
);

const number = (value: string) => (
  <Text ff="monospace" fz={16} fw={600}>
    {value}
  </Text>
);

const timeLimits = (quiz: QuizListItem) => {
  const [main, detailLine] = formatTimeLimits(quiz.timeLimitSeconds, quiz.perQuestionSeconds);
  return (
    <>
      <Text fz={15} fw={600}>
        {main}
      </Text>
      <Text fz={13} c="dimmed">
        {detailLine}
      </Text>
    </>
  );
};

const score = (quiz: QuizListItem) =>
  quiz.completed ? (
    number(`${String(quiz.bestScore ?? 0)} / ${String(quiz.questionCount)}`)
  ) : (
    <Text fz={15} c="dimmed">
      Not taken
    </Text>
  );

const attempts = (quiz: QuizListItem) => (
  <Text fz={15} fw={600}>
    {quiz.retakesAllowed ? 'Unlimited' : 'Only once'}
  </Text>
);

const footer = (quiz: QuizListItem, countries: Country[]) => {
  if (quiz.inProgress) {
    return (
      <>
        <Text fz={14} c="dimmed">
          Started {formatDateTime(quiz.inProgress.startedAt)}
        </Text>
        <Button component={Link} to={`/attempts/${quiz.inProgress.attemptId}`}>
          Resume
        </Button>
      </>
    );
  }

  if (!quiz.completed) {
    return (
      <>
        <Text fz={14} c="dimmed">
          {availability(quiz, countries)}
        </Text>
        <Button component={Link} to={`/quizzes/${quiz.id}`}>
          Start
        </Button>
      </>
    );
  }

  return (
    <>
      {quiz.rank === null ? (
        <span />
      ) : (
        <Anchor component={Link} to={`/leaderboard/${quiz.id}`} fz={14} fw={600} display="inline-block" lh="44px">
          Rank #{quiz.rank} of {quiz.rankedCount}
        </Anchor>
      )}
      {quiz.retakesAllowed ? (
        <Button component={Link} to={`/quizzes/${quiz.id}`} variant="default">
          Retake
        </Button>
      ) : (
        <Button component={Link} to={`/attempts/${quiz.bestAttemptId ?? ''}/results`} variant="default">
          View result
        </Button>
      )}
    </>
  );
};

export const QuizCard = ({ quiz, countries }: QuizCardProps) => {
  return (
    <Card component="article" withBorder radius="lg" p={{ base: 20, sm: 24 }} h="100%" className={classes.card}>
      <Stack gap={18} h="100%">
        <Group gap={8}>{statusBadge(quiz)}</Group>

        <Box>
          <Title order={2} fz={20} mb={6}>
            {quiz.title}
          </Title>
          <Text c="dimmed" fz={15} lh={1.5} lineClamp={2} mih={45}>
            {quiz.description}
          </Text>
        </Box>

        <SimpleGrid component="dl" cols={2} spacing={24} verticalSpacing={14} m={0}>
          {detail('Questions', number(String(quiz.questionCount)))}
          {detail('Time limit', timeLimits(quiz))}
          {detail('Attempts', attempts(quiz))}
          {detail(quiz.retakesAllowed ? 'Best score' : 'Score', score(quiz))}
        </SimpleGrid>

        <Stack mt="auto" gap={18}>
          {progressBar(quiz)}
          <Divider />
          <Group justify="space-between" gap={12} wrap="nowrap">
            {footer(quiz, countries)}
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
};
