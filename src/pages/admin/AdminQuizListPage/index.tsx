import { Box, Button, Flex, Group, Paper, Select, Skeleton, Stack, Text, TextInput, Title } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconFileOff, IconFilterOff, IconSearch } from '@tabler/icons-react';
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AdminQuizList } from '../../../components/AdminQuizList';
import { AdminQuizListSkeleton } from '../../../components/AdminQuizListSkeleton';
import { CountryFilter } from '../../../components/CountryFilter';
import { EmptyState } from '../../../components/EmptyState';
import { ImportQuizButton } from '../../../components/ImportQuizButton';
import { PaginatedList } from '../../../components/PaginatedList';
import { formatCount } from '../../../format';
import { useAdminQuizzes } from '../../../hooks/useAdminQuizzes';
import { useDebouncedSearch } from '../../../hooks/useDebouncedSearch';
import type { AdminQuizItem } from '../../../service/types';
import classes from './AdminQuizListPage.module.css';

const PAGE_SIZE = 10;

type SortKey = 'title_asc' | 'title_desc' | 'questions' | 'questions_asc' | 'attempts' | 'attempts_asc';

const sortOptions: Record<SortKey, { label: string; compare: (a: AdminQuizItem, b: AdminQuizItem) => number }> = {
  title_asc: { label: 'Title, A to Z', compare: (a, b) => a.title.localeCompare(b.title) },
  title_desc: { label: 'Title, Z to A', compare: (a, b) => b.title.localeCompare(a.title) },
  questions: {
    label: 'Most questions',
    compare: (a, b) => b.questionCount - a.questionCount || a.title.localeCompare(b.title)
  },
  questions_asc: {
    label: 'Fewest questions',
    compare: (a, b) => a.questionCount - b.questionCount || a.title.localeCompare(b.title)
  },
  attempts: {
    label: 'Most attempts',
    compare: (a, b) => b.attemptCount - a.attemptCount || a.title.localeCompare(b.title)
  },
  attempts_asc: {
    label: 'Fewest attempts',
    compare: (a, b) => a.attemptCount - b.attemptCount || a.title.localeCompare(b.title)
  }
};

const isSortKey = (value: string | null): value is SortKey => value !== null && value in sortOptions;

type RetakesFilter = 'all' | 'allowed' | 'not_allowed';

const retakesOptions: Record<RetakesFilter, { label: string; matches: (quiz: AdminQuizItem) => boolean }> = {
  all: { label: 'All', matches: () => true },
  allowed: { label: 'Allowed', matches: quiz => quiz.retakesAllowed },
  not_allowed: { label: 'Not allowed', matches: quiz => !quiz.retakesAllowed }
};

const isRetakesFilter = (value: string | null): value is RetakesFilter => value !== null && value in retakesOptions;

const matchesSearch = (quiz: AdminQuizItem, query: string) =>
  !query || `${quiz.title} ${quiz.description}`.toLowerCase().includes(query);

const matchesCountries = (quiz: AdminQuizItem, codes: string[]) =>
  codes.length === 0 || quiz.countries.some(code => codes.includes(code));

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
  const { quizzes, countries, loading, hasFailed, deleteQuiz, exportQuiz, importQuiz } = useAdminQuizzes();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('q') ?? '';
  const { search, setSearch, debouncedSearch, query } = useDebouncedSearch(urlSearch);
  const sortParam = searchParams.get('sort');
  const sort: SortKey = isSortKey(sortParam) ? sortParam : 'title_asc';

  const selectedCountries = searchParams.get('countries')?.split(',') ?? [];
  const retakesParam = searchParams.get('retakes');
  const retakes: RetakesFilter = isRetakesFilter(retakesParam) ? retakesParam : 'all';

  const matching = quizzes
    .filter(
      quiz =>
        matchesSearch(quiz, query) && matchesCountries(quiz, selectedCountries) && retakesOptions[retakes].matches(quiz)
    )
    .sort(sortOptions[sort].compare);
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
      <title>Manage quizzes - Quizwise</title>
      <Flex
        pos="sticky"
        top={{ base: 60, sm: 68 }}
        bg="var(--bg)"
        wrap="wrap"
        justify="space-between"
        align="flex-end"
        gap={16}
        py={12}
        mt={-12}
        className={classes.toolbar}
      >
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
        <Group gap={10} justify="space-between" w={{ base: '100%', sm: 'auto' }}>
          <ImportQuizButton onImport={importQuiz} />
          <Button component={Link} to="/admin/quizzes/new">
            New quiz
          </Button>
        </Group>
      </Flex>

      {loading ? (
        <AdminQuizListSkeleton withHeader={false} />
      ) : (
        <PaginatedList
          items={matching}
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
                  label="Search"
                  placeholder="Title or description"
                  value={search}
                  onChange={event => {
                    setSearch(event.currentTarget.value);
                  }}
                  flex={1}
                />
                <Box w={{ base: '100%', sm: 220 }}>
                  <CountryFilter
                    countries={countries}
                    value={selectedCountries}
                    onChange={value => {
                      updateParams({ countries: value.join(','), page: '' });
                    }}
                  />
                </Box>
                <Select
                  label="Retakes"
                  data={Object.entries(retakesOptions).map(([value, option]) => ({ value, label: option.label }))}
                  value={retakes}
                  onChange={value => {
                    updateParams({ retakes: value === 'all' ? '' : (value ?? ''), page: '' });
                  }}
                  allowDeselect={false}
                  w={{ base: '100%', sm: 150 }}
                />
                <Select
                  label="Sort by"
                  data={Object.entries(sortOptions).map(([value, option]) => ({ value, label: option.label }))}
                  value={sort}
                  onChange={value => {
                    updateParams({ sort: value === 'title_asc' ? '' : (value ?? ''), page: '' });
                  }}
                  allowDeselect={false}
                  w={{ base: '100%', sm: 220 }}
                />
              </Flex>

              {hasFailed && (
                <Text c="dimmed" p={16} pt={0}>
                  The quizzes could not be loaded. Try reloading the page.
                </Text>
              )}

              {!hasFailed && quizzes.length === 0 && (
                <EmptyState
                  icon={<IconFileOff size={28} />}
                  title="No quizzes yet"
                  action={
                    <Button component={Link} to="/admin/quizzes/new">
                      New quiz
                    </Button>
                  }
                >
                  Create a quiz or import one from JSON.
                </EmptyState>
              )}

              {quizzes.length > 0 && matching.length === 0 && (
                <EmptyState
                  icon={debouncedSearch.trim() ? <IconSearch size={28} /> : <IconFilterOff size={28} />}
                  title="No results found"
                  action={
                    <Button
                      variant="default"
                      onClick={() => {
                        setSearch('');
                        updateParams({ countries: '', retakes: '', page: '' });
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                >
                  {debouncedSearch.trim()
                    ? `No quizzes match "${debouncedSearch.trim()}".`
                    : 'No quizzes match these filters.'}
                </EmptyState>
              )}

              {shown.length > 0 && (
                <AdminQuizList
                  quizzes={shown}
                  countries={countries}
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
      )}
    </Stack>
  );
};
