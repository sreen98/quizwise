import {
  Box,
  Button,
  Flex,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
  VisuallyHidden
} from '@mantine/core';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { EmptyQuizList } from '../../components/EmptyQuizList';
import { PaginatedList } from '../../components/PaginatedList';
import { QuizCard } from '../../components/QuizCard';
import { QuizCardSkeleton } from '../../components/QuizCardSkeleton';
import { greetingFor } from '../../format';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { useQuizList } from '../../hooks/useQuizList';
import type { QuizListItem } from '../../service/types';
import { useSessionStore } from '../../session/sessionStore';

const ALL_COUNTRIES = 'all';
const PAGE_SIZE = 12;

type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'completed';

interface StatusDetails {
  label: string;
  matches: (quiz: QuizListItem) => boolean;
}

const statusFilters: Record<StatusFilter, StatusDetails> = {
  all: { label: 'All', matches: () => true },
  not_started: { label: 'Not started', matches: quiz => !quiz.completed && !quiz.inProgress },
  in_progress: { label: 'In progress', matches: quiz => quiz.inProgress !== null },
  completed: { label: 'Completed', matches: quiz => quiz.completed }
};

const isStatusFilter = (value: string): value is StatusFilter => value in statusFilters;

export const QuizListPage = () => {
  const userId = useSessionStore(state => state.userId);
  const country = useSessionStore(state => state.country);
  const setCountry = useSessionStore(state => state.setCountry);
  const { quizzes, countries, userName, userCountry, loading, hasFailed } = useQuizList(userId, country);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const { search, setSearch, debouncedSearch, query } = useDebouncedSearch();

  const changePage = (value: number) => {
    const next = new URLSearchParams(searchParams);
    if (value === 1) next.delete('page');
    else next.set('page', String(value));
    setSearchParams(next, { replace: true });
  };

  const selectedCountry = country ?? userCountry;
  const countryName =
    selectedCountry === ALL_COUNTRIES
      ? 'all countries'
      : (countries.find(item => item.code === selectedCountry)?.name ?? selectedCountry);
  const countryOptions = [
    ...countries.map(item => ({ value: item.code, label: item.name })),
    { value: ALL_COUNTRIES, label: 'All countries' }
  ];
  const activeFilter = statusFilters[status];
  const statusQuizzes = quizzes.filter(activeFilter.matches);
  const matchingQuizzes = statusQuizzes.filter(
    quiz => !query || `${quiz.title} ${quiz.description}`.toLowerCase().includes(query)
  );
  const statusOptions = Object.entries(statusFilters).map(([value, filter]) => ({
    value,
    label: loading ? filter.label : `${filter.label} (${String(quizzes.filter(filter.matches).length)})`
  }));

  return (
    <Stack gap={24}>
      <Flex wrap="wrap" justify="space-between" align="flex-end" columnGap={32} rowGap={20}>
        <Box>
          <Skeleton visible={loading} w="fit-content" mb={8}>
            <Text fz={14} fw={600} c="dimmed">
              {greetingFor(new Date().getHours())}, {loading ? 'loading' : userName.split(' ')[0]}
            </Text>
          </Skeleton>
          <Title order={1} fz={{ base: 28, sm: 36 }} lts="-0.01em">
            Your quizzes
          </Title>
        </Box>

        <Flex direction={{ base: 'column', sm: 'row' }} gap={12} w={{ base: '100%', sm: 'auto' }}>
          <TextInput
            label="Search"
            placeholder="Title or description"
            value={search}
            onChange={event => {
              setSearch(event.currentTarget.value);
              changePage(1);
            }}
            w={{ sm: 240 }}
          />
          <Select
            label="Status"
            data={statusOptions}
            value={status}
            onChange={value => {
              if (value && isStatusFilter(value)) {
                setStatus(value);
                changePage(1);
              }
            }}
            allowDeselect={false}
            flex={1}
            miw={0}
            w={{ sm: 200 }}
          />
          <Select
            label="Country"
            data={countryOptions}
            value={countries.length > 0 ? selectedCountry : null}
            onChange={value => {
              if (value) {
                setCountry(value);
                changePage(1);
              }
            }}
            allowDeselect={false}
            flex={1}
            miw={0}
            w={{ sm: 220 }}
          />
        </Flex>
      </Flex>

      <Box aria-busy={loading}>
        {loading && (
          <>
            <VisuallyHidden role="status">Loading quizzes</VisuallyHidden>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={20}>
              <QuizCardSkeleton />
              <QuizCardSkeleton />
              <QuizCardSkeleton />
            </SimpleGrid>
          </>
        )}

        {!loading && hasFailed && <Text c="dimmed">The quizzes could not be loaded. Try reloading the page.</Text>}

        {!loading && !hasFailed && quizzes.length === 0 && (
          <EmptyQuizList
            countryName={countryName}
            onShowAll={() => {
              setCountry(ALL_COUNTRIES);
            }}
          />
        )}

        {!loading && quizzes.length > 0 && statusQuizzes.length === 0 && (
          <Stack align="flex-start" gap={12}>
            <Text c="dimmed">No quizzes are {activeFilter.label.toLowerCase()} here.</Text>
            <Button
              variant="default"
              onClick={() => {
                setStatus('all');
              }}
            >
              Show all quizzes
            </Button>
          </Stack>
        )}

        {!loading && statusQuizzes.length > 0 && matchingQuizzes.length === 0 && (
          <Stack align="flex-start" gap={12}>
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

        {!loading && matchingQuizzes.length > 0 && (
          <PaginatedList
            items={matchingQuizzes}
            page={Number(searchParams.get('page'))}
            pageSize={PAGE_SIZE}
            itemName="quiz"
            itemsName="quizzes"
            onPageChange={changePage}
          >
            {shown => (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={20}>
                {shown.map(quiz => (
                  <QuizCard key={quiz.id} quiz={quiz} countries={countries} />
                ))}
              </SimpleGrid>
            )}
          </PaginatedList>
        )}
      </Box>
    </Stack>
  );
};
