import { ActionIcon, Box, Divider, Group, Stack, Table, Text, VisuallyHidden } from '@mantine/core';
import { IconCheck, IconDownload, IconPencil, IconTrash, IconX } from '@tabler/icons-react';
import { Link } from 'react-router';
import { formatCount, formatTimerShort } from '../../format';
import { AdminQuizTableHead } from '../AdminQuizTableHead';
import { CountryFlags } from '../CountryFlags';
import { TruncatedText } from '../TruncatedText';
import type { AdminQuizItem } from '../../service/types';
import type { AdminQuizListProps } from './types';

const timerText = ({ timeLimitSeconds, perQuestionSeconds }: AdminQuizItem) =>
  formatTimerShort(timeLimitSeconds, perQuestionSeconds) ?? 'None';

const retakesMark = (quiz: AdminQuizItem) => (
  <>
    {quiz.retakesAllowed ? (
      <IconCheck size={20} color="var(--mantine-primary-color-filled)" aria-hidden />
    ) : (
      <IconX size={20} color="var(--mantine-color-dimmed)" aria-hidden />
    )}
    <VisuallyHidden>{quiz.retakesAllowed ? 'Retakes allowed' : 'No retakes'}</VisuallyHidden>
  </>
);

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
        <AdminQuizTableHead />
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
              <Table.Td>{retakesMark(quiz)}</Table.Td>
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
