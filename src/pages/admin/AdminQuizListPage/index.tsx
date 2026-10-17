import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Group,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  VisuallyHidden
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { Link, useSearchParams } from 'react-router';
import { formatClock, formatSeconds } from '../../../format';
import { useAdminQuizzes } from '../../../hooks/useAdminQuizzes';
import { quizService } from '../../../service/quizService';
import type { AdminQuizItem } from '../../../service/types';

const PAGE_SIZE = 10;

type SortKey = 'title_asc' | 'title_desc' | 'questions' | 'attempts';

const sortOptions: Record<SortKey, { label: string; compare: (a: AdminQuizItem, b: AdminQuizItem) => number }> = {
  title_asc: { label: 'Title, A to Z', compare: (a, b) => a.title.localeCompare(b.title) },
  title_desc: { label: 'Title, Z to A', compare: (a, b) => b.title.localeCompare(a.title) },
  questions: {
    label: 'Most questions',
    compare: (a, b) => b.questionCount - a.questionCount || a.title.localeCompare(b.title)
  },
  attempts: {
    label: 'Most attempts',
    compare: (a, b) => b.attemptCount - a.attemptCount || a.title.localeCompare(b.title)
  }
};

const isSortKey = (value: string | null): value is SortKey => value !== null && value in sortOptions;

const plural = (count: number, word: string, pluralWord = word + 's') =>
  `${String(count)} ${count === 1 ? word : pluralWord}`;

const timerText = ({ timeLimitSeconds, perQuestionSeconds }: AdminQuizItem) => {
  if (timeLimitSeconds !== null && perQuestionSeconds !== null) {
    return `${formatClock(timeLimitSeconds)} + ${formatSeconds(perQuestionSeconds)} / q`;
  }
  if (timeLimitSeconds !== null) return formatClock(timeLimitSeconds);
  if (perQuestionSeconds !== null) return `${formatSeconds(perQuestionSeconds)} / q`;
  return 'None';
};

const matchesSearch = (quiz: AdminQuizItem, search: string) => {
  const query = search.trim().toLowerCase();
  return !query || `${quiz.title} ${quiz.description}`.toLowerCase().includes(query);
};

const confirmDelete = (quiz: AdminQuizItem) => {
  modals.openConfirmModal({
    title: `Delete ${quiz.title}?`,
    children: (
      <Text size="sm">
        {quiz.attemptCount > 0
          ? `Its ${plural(quiz.attemptCount, 'attempt')} and its leaderboard are deleted too.`
          : 'It has no attempts yet.'}{' '}
        Anyone taking it now will see that it's no longer available.
      </Text>
    ),
    labels: { confirm: 'Delete quiz', cancel: 'Cancel' },
    confirmProps: { color: 'orange' },
    onConfirm: () => {
      void quizService.deleteQuiz(quiz.id).then(() => {
        notifications.show({ message: `${quiz.title} deleted` });
      });
    }
  });
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

const actions = (quiz: AdminQuizItem) => (
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
        confirmDelete(quiz);
      }}
    >
      <IconTrash size={20} aria-hidden />
    </ActionIcon>
  </Group>
);

const quizTable = (quizzes: AdminQuizItem[]) => (
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
              <Table.Td>{actions(quiz)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  </Box>
);

const quizCards = (quizzes: AdminQuizItem[]) => (
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
            {actions(quiz)}
          </Group>
          <Group gap={16} mt={10} fz={14} c="dimmed">
            <span>{plural(quiz.questionCount, 'question')}</span>
            <Text component="span" ff="monospace" inherit>
              {timerText(quiz)}
            </Text>
            <span>{quiz.retakesAllowed ? 'Retakes allowed' : 'One attempt'}</span>
            <span>{plural(quiz.attemptCount, 'attempt')}</span>
          </Group>
          <Box mt={8}>{countryBadges(quiz)}</Box>
        </Box>
      </Box>
    ))}
  </Stack>
);

export const AdminQuizListPage = () => {
  const { quizzes, loading, hasFailed } = useAdminQuizzes();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const sortParam = searchParams.get('sort');
  const sort: SortKey = isSortKey(sortParam) ? sortParam : 'title_asc';

  const matching = quizzes.filter(quiz => matchesSearch(quiz, search)).sort(sortOptions[sort].compare);
  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(searchParams.get('page')) || 1), pageCount);
  const shown = matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const attemptTotal = quizzes.reduce((total, quiz) => total + quiz.attemptCount, 0);

  const updateParams = (changes: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <Stack gap={24}>
      <Flex wrap="wrap" justify="space-between" align="flex-end" gap={16}>
        <Box>
          <Title order={1} fz={{ base: 28, sm: 36 }} lts="-0.01em">
            Manage quizzes
          </Title>
          <Skeleton visible={loading} w="fit-content" mt={8}>
            <Text c="dimmed" fz={16}>
              {plural(quizzes.length, 'quiz', 'quizzes')} · {plural(attemptTotal, 'attempt')} recorded
            </Text>
          </Skeleton>
        </Box>
        <Button component={Link} to="/admin/quizzes/new">
          New quiz
        </Button>
      </Flex>

      <Paper withBorder radius="lg">
        <Flex direction={{ base: 'column', sm: 'row' }} gap={12} p={16}>
          <TextInput
            aria-label="Search quizzes"
            placeholder="Search by title or description"
            value={search}
            onChange={event => {
              updateParams({ q: event.currentTarget.value, page: '' });
            }}
            flex={1}
          />
          <Select
            aria-label="Sort by"
            data={Object.entries(sortOptions).map(([value, option]) => ({ value, label: option.label }))}
            value={sort}
            onChange={value => {
              updateParams({ sort: value === 'title_asc' ? '' : (value ?? ''), page: '' });
            }}
            allowDeselect={false}
            w={{ base: '100%', sm: 220 }}
          />
        </Flex>

        {loading && (
          <Stack gap={8} p={16} pt={0}>
            {[1, 2, 3].map(index => (
              <Skeleton key={index} h={56} />
            ))}
          </Stack>
        )}

        {!loading && hasFailed && (
          <Text c="dimmed" p={16} pt={0}>
            The quizzes could not be loaded. Try reloading the page.
          </Text>
        )}

        {!loading && !hasFailed && quizzes.length === 0 && (
          <Stack align="flex-start" gap={12} p={16} pt={0}>
            <Text c="dimmed">There are no quizzes yet.</Text>
            <Button component={Link} to="/admin/quizzes/new">
              New quiz
            </Button>
          </Stack>
        )}

        {!loading && quizzes.length > 0 && matching.length === 0 && (
          <Stack align="flex-start" gap={12} p={16} pt={0}>
            <Text c="dimmed">No quizzes match "{search.trim()}".</Text>
            <Button
              variant="default"
              onClick={() => {
                updateParams({ q: '', page: '' });
              }}
            >
              Clear search
            </Button>
          </Stack>
        )}

        {!loading && shown.length > 0 && (
          <>
            {quizTable(shown)}
            {quizCards(shown)}
          </>
        )}
      </Paper>

      {pageCount > 1 && (
        <Pagination
          total={pageCount}
          value={page}
          onChange={value => {
            updateParams({ page: value === 1 ? '' : String(value) });
          }}
          getControlProps={control => ({ 'aria-label': `${control} page` })}
          getItemProps={pageNumber => ({ 'aria-label': `Page ${String(pageNumber)}` })}
          size="lg"
        />
      )}
    </Stack>
  );
};
