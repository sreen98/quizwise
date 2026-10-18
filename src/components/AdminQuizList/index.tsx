import { ActionIcon, Box, Divider, Group, Stack, Table, Text, VisuallyHidden } from '@mantine/core';
import { IconDownload, IconPencil, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router';
import { formatCount, formatTimerShort } from '../../format';
import { CountryFlags } from '../CountryFlags';
import { TruncatedText } from '../TruncatedText';
import type { AdminQuizItem } from '../../service/types';
import type { AdminQuizListProps } from './types';

const timerText = ({ timeLimitSeconds, perQuestionSeconds }: AdminQuizItem) =>
  formatTimerShort(timeLimitSeconds, perQuestionSeconds) ?? 'None';

const columns = [
  { label: 'Title', width: undefined, isNumber: false },
  { label: 'Questions', width: 110, isNumber: true },
  { label: 'Timer', width: 160, isNumber: false },
  { label: 'Retakes', width: 90, isNumber: false },
  { label: 'Countries', width: 150, isNumber: false },
  { label: 'Attempts', width: 100, isNumber: true }
];

const countryFlags = (quiz: AdminQuizItem, { countries }: AdminQuizListProps) => (
  <CountryFlags codes={quiz.countries} countries={countries} />
);

const actions = (quiz: AdminQuizItem, { onExport, onDelete }: AdminQuizListProps) => (
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
      aria-label={`Export ${quiz.title} as JSON`}
      onClick={() => {
        onExport(quiz);
      }}
    >
      <IconDownload size={20} aria-hidden />
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

const quizTable = (props: AdminQuizListProps) => (
  <Box visibleFrom="lg">
    <Table.ScrollContainer minWidth={1020} type="native">
      <Table layout="fixed" verticalSpacing={14} horizontalSpacing={16} fz={15}>
        <Table.Caption>
          <VisuallyHidden>Quizzes</VisuallyHidden>
        </Table.Caption>
        <Table.Thead>
          <Table.Tr>
            {columns.map(({ label, width, isNumber }) => (
              <Table.Th
                key={label}
                w={width}
                ta={isNumber ? 'right' : undefined}
                fz={12}
                fw={700}
                tt="uppercase"
                lts="0.06em"
                c="dimmed"
              >
                {label}
              </Table.Th>
            ))}
            <Table.Th w={170}>
              <VisuallyHidden>Actions</VisuallyHidden>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {props.quizzes.map(quiz => (
            <Table.Tr key={quiz.id}>
              <Table.Td>
                <TruncatedText fw={700} inherit>
                  {quiz.title}
                </TruncatedText>
                <TruncatedText fz={13} c="dimmed">
                  {quiz.description}
                </TruncatedText>
              </Table.Td>
              <Table.Td ta="right">{quiz.questionCount}</Table.Td>
              <Table.Td>
                <TruncatedText ff="monospace" fz={14}>
                  {timerText(quiz)}
                </TruncatedText>
              </Table.Td>
              <Table.Td>{quiz.retakesAllowed ? 'Yes' : 'No'}</Table.Td>
              <Table.Td>{countryFlags(quiz, props)}</Table.Td>
              <Table.Td ta="right">{quiz.attemptCount}</Table.Td>
              <Table.Td>{actions(quiz, props)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  </Box>
);

const quizCards = (props: AdminQuizListProps) => (
  <Stack component="ul" gap={0} m={0} p={0} hiddenFrom="lg" aria-label="Quizzes">
    {props.quizzes.map((quiz, index) => (
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
            {actions(quiz, props)}
          </Group>
          <Group gap={16} mt={10} fz={14} c="dimmed">
            <span>{formatCount(quiz.questionCount, 'question')}</span>
            <Text component="span" ff="monospace" inherit>
              {timerText(quiz)}
            </Text>
            <span>{quiz.retakesAllowed ? 'Unlimited attempts' : 'Only once'}</span>
            <span>{formatCount(quiz.attemptCount, 'attempt')}</span>
          </Group>
          <Box mt={8}>{countryFlags(quiz, props)}</Box>
        </Box>
      </Box>
    ))}
  </Stack>
);

export const AdminQuizList = ({ quizzes, countries, onExport, onDelete }: AdminQuizListProps) => {
  const props = { quizzes, countries, onExport, onDelete };

  return (
    <>
      {quizTable(props)}
      {quizCards(props)}
    </>
  );
};
