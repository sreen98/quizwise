import { ActionIcon, Badge, Box, Divider, Group, Stack, Table, Text, VisuallyHidden } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router';
import { formatClock, formatCount, formatSeconds } from '../../format';
import type { AdminQuizItem } from '../../service/types';
import type { AdminQuizListProps } from './types';

const timerText = ({ timeLimitSeconds, perQuestionSeconds }: AdminQuizItem) => {
  if (timeLimitSeconds !== null && perQuestionSeconds !== null) {
    return `${formatClock(timeLimitSeconds)} + ${formatSeconds(perQuestionSeconds)} / q`;
  }
  if (timeLimitSeconds !== null) return formatClock(timeLimitSeconds);
  if (perQuestionSeconds !== null) return `${formatSeconds(perQuestionSeconds)} / q`;
  return 'None';
};

const countryBadges = (quiz: AdminQuizItem) => (
  <Group gap={4}>
    {quiz.countries.map(code => (
      <Badge key={code} variant="default" size="md">
        {code}
      </Badge>
    ))}
  </Group>
);

const actions = (quiz: AdminQuizItem, onDelete: (quiz: AdminQuizItem) => void) => (
  <Group gap={2} justify="flex-end" wrap="nowrap">
    <ActionIcon
      component={Link}
      to={`/admin/quizzes/${quiz.id}/edit`}
      variant="subtle"
      color="gray"
      size={44}
      aria-label={`Edit ${quiz.title}`}
    >
      <IconPencil size={20} aria-hidden />
    </ActionIcon>
    <ActionIcon
      variant="subtle"
      color="gray"
      size={44}
      aria-label={`Delete ${quiz.title}`}
      onClick={() => {
        onDelete(quiz);
      }}
    >
      <IconTrash size={20} aria-hidden />
    </ActionIcon>
  </Group>
);

const quizTable = (quizzes: AdminQuizItem[], onDelete: (quiz: AdminQuizItem) => void) => (
  <Box visibleFrom="md">
    <Table.ScrollContainer minWidth={760} type="native">
      <Table verticalSpacing={14} horizontalSpacing={16} fz={15}>
        <Table.Caption>
          <VisuallyHidden>Quizzes</VisuallyHidden>
        </Table.Caption>
        <Table.Thead>
          <Table.Tr>
            {['Title', 'Questions', 'Timer', 'Retakes', 'Countries', 'Attempts'].map(label => (
              <Table.Th key={label} fz={12} fw={700} tt="uppercase" lts="0.06em" c="dimmed">
                {label}
              </Table.Th>
            ))}
            <Table.Th>
              <VisuallyHidden>Actions</VisuallyHidden>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {quizzes.map(quiz => (
            <Table.Tr key={quiz.id}>
              <Table.Td>
                <Text fw={700} inherit>
                  {quiz.title}
                </Text>
                <Text fz={13} c="dimmed" lineClamp={1}>
                  {quiz.description}
                </Text>
              </Table.Td>
              <Table.Td>{quiz.questionCount}</Table.Td>
              <Table.Td ff="monospace" fz={14}>
                {timerText(quiz)}
              </Table.Td>
              <Table.Td>{quiz.retakesAllowed ? 'Yes' : 'No'}</Table.Td>
              <Table.Td>{countryBadges(quiz)}</Table.Td>
              <Table.Td>{quiz.attemptCount}</Table.Td>
              <Table.Td>{actions(quiz, onDelete)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  </Box>
);

const quizCards = (quizzes: AdminQuizItem[], onDelete: (quiz: AdminQuizItem) => void) => (
  <Stack component="ul" gap={0} m={0} p={0} hiddenFrom="md" aria-label="Quizzes">
    {quizzes.map((quiz, index) => (
      <Box component="li" key={quiz.id} display="block">
        {index > 0 && <Divider />}
        <Box px={16} py={14}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap={8}>
            <Box miw={0}>
              <Text fw={700}>{quiz.title}</Text>
              <Text fz={13} c="dimmed" lineClamp={2}>
                {quiz.description}
              </Text>
            </Box>
            {actions(quiz, onDelete)}
          </Group>
          <Group gap={16} mt={10} fz={14} c="dimmed">
            <span>{formatCount(quiz.questionCount, 'question')}</span>
            <Text component="span" ff="monospace" inherit>
              {timerText(quiz)}
            </Text>
            <span>{quiz.retakesAllowed ? 'Retakes allowed' : 'One attempt'}</span>
            <span>{formatCount(quiz.attemptCount, 'attempt')}</span>
          </Group>
          <Box mt={8}>{countryBadges(quiz)}</Box>
        </Box>
      </Box>
    ))}
  </Stack>
);

export const AdminQuizList = ({ quizzes, onDelete }: AdminQuizListProps) => {
  return (
    <>
      {quizTable(quizzes, onDelete)}
      {quizCards(quizzes, onDelete)}
    </>
  );
};
