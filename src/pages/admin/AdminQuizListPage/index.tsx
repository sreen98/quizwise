import { Box, Button, Flex, Group, Paper, Select, Skeleton, Stack, Text, TextInput, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AdminQuizList } from '../../../components/AdminQuizList';
import { ImportQuizButton } from '../../../components/ImportQuizButton';
import { PaginatedList } from '../../../components/PaginatedList';
import { formatCount } from '../../../format';
import { useAdminQuizzes } from '../../../hooks/useAdminQuizzes';
import { useDebouncedSearch } from '../../../hooks/useDebouncedSearch';
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

const matchesSearch = (quiz: AdminQuizItem, query: string) =>
  !query || `${quiz.title} ${quiz.description}`.toLowerCase().includes(query);

type DeleteQuiz = (quizId: string) => Promise<void>;

const confirmDelete = (quiz: AdminQuizItem, deleteQuiz: DeleteQuiz) => {
  modals.openConfirmModal({
    title: `Delete ${quiz.title}?`,
    children: (
      <Text size="sm">
        {quiz.attemptCount > 0
          ? `Its ${formatCount(quiz.attemptCount, 'attempt')} and its leaderboard are deleted too.`
          : 'It has no attempts yet.'}{' '}
        Anyone taking it now will see that it's no longer available.
      </Text>
    ),
    labels: { confirm: 'Delete quiz', cancel: 'Cancel' },
    confirmProps: { color: 'orange' },
    onConfirm: () => {
      deleteQuiz(quiz.id)
        .then(() => {
          notifications.show({ message: `${quiz.title} deleted` });
        })
        .catch(() => {
          notifications.show({
            color: 'orange',
            message: `Couldn't delete ${quiz.title}. It may already have been deleted.`
          });
        });
    }
  });
};

export const AdminQuizListPage = () => {
  const { quizzes, loading, hasFailed, deleteQuiz, exportQuiz, importQuiz } = useAdminQuizzes();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('q') ?? '';
  const { search, setSearch, debouncedSearch, query } = useDebouncedSearch(urlSearch);
  const sortParam = searchParams.get('sort');
  const sort: SortKey = isSortKey(sortParam) ? sortParam : 'title_asc';

  const matching = quizzes.filter(quiz => matchesSearch(quiz, query)).sort(sortOptions[sort].compare);
  const attemptTotal = quizzes.reduce((total, quiz) => total + quiz.attemptCount, 0);

  const updateParams = (changes: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('q', debouncedSearch);
    else next.delete('q');
    next.delete('page');
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, urlSearch, searchParams, setSearchParams]);

  return (
    <Stack gap={24}>
      <Flex wrap="wrap" justify="space-between" align="flex-end" gap={16}>
        <Box>
          <Title order={1} fz={{ base: 28, sm: 36 }} lts="-0.01em">
            Manage quizzes
          </Title>
          <Skeleton visible={loading} w="fit-content" mt={8}>
            <Text c="dimmed" fz={16}>
              {formatCount(quizzes.length, 'quiz', 'quizzes')} · {formatCount(attemptTotal, 'attempt')} recorded
            </Text>
          </Skeleton>
        </Box>
        <Group gap={10}>
          <ImportQuizButton onImport={importQuiz} />
          <Button component={Link} to="/admin/quizzes/new">
            New quiz
          </Button>
        </Group>
      </Flex>

      <PaginatedList
        items={loading ? [] : matching}
        page={Number(searchParams.get('page'))}
        pageSize={PAGE_SIZE}
        itemName="quiz"
        itemsName="quizzes"
        onPageChange={value => {
          updateParams({ page: value === 1 ? '' : String(value) });
        }}
      >
        {shown => (
          <Paper withBorder radius="lg">
            <Flex direction={{ base: 'column', sm: 'row' }} gap={12} p={16}>
              <TextInput
                aria-label="Search quizzes"
                placeholder="Search by title or description"
                value={search}
                onChange={event => {
                  setSearch(event.currentTarget.value);
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
                <Text c="dimmed">No quizzes match "{debouncedSearch.trim()}".</Text>
                <Button
                  variant="default"
                  onClick={() => {
                    setSearch('');
                  }}
                >
                  Clear search
                </Button>
              </Stack>
            )}

            {!loading && shown.length > 0 && (
              <AdminQuizList
                quizzes={shown}
                onExport={quiz => {
                  exportQuiz(quiz).catch(() => {
                    notifications.show({
                      color: 'orange',
                      message: `Couldn't export ${quiz.title}. It may have been deleted.`
                    });
                  });
                }}
                onDelete={quiz => {
                  confirmDelete(quiz, deleteQuiz);
                }}
              />
            )}
          </Paper>
        )}
      </PaginatedList>
    </Stack>
  );
};
