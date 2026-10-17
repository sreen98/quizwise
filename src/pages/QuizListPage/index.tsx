import { Box, Button, Flex, Select, SimpleGrid, Skeleton, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import { useState } from 'react';
import { EmptyQuizList } from '../../components/EmptyQuizList';
import { QuizCard } from '../../components/QuizCard';
import { QuizCardSkeleton } from '../../components/QuizCardSkeleton';
import { greetingFor } from '../../format';
import { useQuizList } from '../../hooks/useQuizList';
import type { QuizListItem } from '../../service/types';
import { useSessionStore } from '../../session/sessionStore';

const ALL_COUNTRIES = 'all';

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
  const shownQuizzes = quizzes.filter(activeFilter.matches);
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
          <Select
            label="Status"
            data={statusOptions}
            value={status}
            onChange={value => {
              if (value && isStatusFilter(value)) setStatus(value);
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
              if (value) setCountry(value);
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

        {!loading && quizzes.length > 0 && shownQuizzes.length === 0 && (
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

        {!loading && shownQuizzes.length > 0 && (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={20}>
            {shownQuizzes.map(quiz => (
              <QuizCard key={quiz.id} quiz={quiz} countries={countries} />
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Stack>
  );
};
