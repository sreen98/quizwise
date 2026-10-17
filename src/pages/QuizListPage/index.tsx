import { Box, Group, Select, SimpleGrid, Skeleton, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import { EmptyQuizList } from '../../components/EmptyQuizList';
import { QuizCard } from '../../components/QuizCard';
import { QuizCardSkeleton } from '../../components/QuizCardSkeleton';
import { greetingFor } from '../../format';
import { useQuizList } from '../../hooks/useQuizList';
import { useSessionStore } from '../../session/sessionStore';

const ALL_COUNTRIES = 'all';

const quizCount = (count: number) => `${String(count)} ${count === 1 ? 'quiz' : 'quizzes'}`;

export const QuizListPage = () => {
  const userId = useSessionStore(state => state.userId);
  const country = useSessionStore(state => state.country);
  const setCountry = useSessionStore(state => state.setCountry);
  const { quizzes, countries, userName, userCountry, loading, failed } = useQuizList(userId, country);

  const selectedCountry = country ?? userCountry;
  const countryName =
    selectedCountry === ALL_COUNTRIES
      ? 'all countries'
      : (countries.find(item => item.code === selectedCountry)?.name ?? selectedCountry);
  const completedCount = quizzes.filter(quiz => quiz.completed).length;
  const inProgressCount = quizzes.filter(quiz => quiz.inProgress).length;
  const summary = [
    `${quizCount(quizzes.length)} available in ${countryName}`,
    `${String(completedCount)} completed`,
    `${String(inProgressCount)} in progress`
  ].join(' · ');
  const countryOptions = [
    ...countries.map(item => ({ value: item.code, label: item.name })),
    { value: ALL_COUNTRIES, label: 'All countries' }
  ];

  return (
    <Stack gap={28}>
      <Group justify="space-between" align="flex-end" gap={20}>
        <Box>
          <Skeleton visible={loading} w="fit-content" mb={8}>
            <Text fz={14} fw={600} c="dimmed">
              {greetingFor(new Date().getHours())}, {loading ? 'loading' : userName.split(' ')[0]}
            </Text>
          </Skeleton>
          <Title order={1} fz={{ base: 28, sm: 36 }} lts="-0.01em">
            Your quizzes
          </Title>
          <Skeleton visible={loading} w="fit-content" mt={8}>
            <Text c="dimmed" fz={16}>
              {loading ? 'Loading quizzes for this country' : summary}
            </Text>
          </Skeleton>
        </Box>
        <Select
          label="Country"
          data={countryOptions}
          value={countries.length > 0 ? selectedCountry : null}
          onChange={value => {
            if (value) setCountry(value);
          }}
          allowDeselect={false}
          w={{ base: '100%', sm: 220 }}
        />
      </Group>

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

        {!loading && failed && <Text c="dimmed">The quizzes could not be loaded. Try reloading the page.</Text>}

        {!loading && !failed && quizzes.length === 0 && (
          <EmptyQuizList
            countryName={countryName}
            onShowAll={() => {
              setCountry(ALL_COUNTRIES);
            }}
          />
        )}

        {!loading && quizzes.length > 0 && (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={20}>
            {quizzes.map(quiz => (
              <QuizCard key={quiz.id} quiz={quiz} countries={countries} />
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Stack>
  );
};
