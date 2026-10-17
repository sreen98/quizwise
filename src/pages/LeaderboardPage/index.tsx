import {
  Anchor,
  Badge,
  Box,
  Button,
  Flex,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { PodiumCard } from '../../components/PodiumCard';
import { RankBanner } from '../../components/RankBanner';
import { StandingsList } from '../../components/StandingsList';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import type { Leaderboard, LeaderboardEntry } from '../../service/types';
import { useSessionStore } from '../../session/sessionStore';
import classes from './LeaderboardPage.module.css';

const topOptions = [
  { value: '3', label: 'Top 3' },
  { value: '10', label: 'Top 10' },
  { value: '25', label: 'Top 25' }
];

const PODIUM_SIZE = 3;

const matchesSearch = (entry: LeaderboardEntry, search: string) => {
  const query = search.trim().toLowerCase();
  return !query || `${entry.userName} ${entry.countryName}`.toLowerCase().includes(query);
};

const board = (
  leaderboard: Leaderboard,
  quizId: string,
  userId: string,
  search: string,
  onSearchChange: (value: string) => void
) => {
  const podium = leaderboard.entries.slice(0, PODIUM_SIZE);
  const standings = leaderboard.entries.filter(entry => matchesSearch(entry, search));

  return (
    <Stack gap={28}>
      <RankBanner leaderboard={leaderboard} quizId={quizId} />
      <SimpleGrid
        component="ol"
        className={classes.podium}
        cols={{ base: 1, sm: 3 }}
        spacing={{ base: 12, sm: 20 }}
        m={0}
        p={0}
        aria-label="Top players"
      >
        {podium.map(entry => (
          <PodiumCard key={entry.userId} entry={entry} isMe={entry.userId === userId} />
        ))}
      </SimpleGrid>
      <Stack gap={14}>
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', sm: 'center' }}
          gap={12}
        >
          <Group gap={10}>
            <Title order={2} fz={20}>
              Standings
            </Title>
            <Badge variant="default">
              Showing {standings.length} of {leaderboard.rankedCount}
            </Badge>
          </Group>
          <TextInput
            aria-label="Search players"
            placeholder="Search player or country"
            value={search}
            onChange={event => {
              onSearchChange(event.currentTarget.value);
            }}
            w={{ base: '100%', sm: 280 }}
          />
        </Flex>
        {standings.length === 0 ? (
          <Text c="dimmed">No players match "{search.trim()}".</Text>
        ) : (
          <StandingsList quizTitle={leaderboard.quizTitle} entries={standings} userId={userId} />
        )}
      </Stack>
    </Stack>
  );
};

export const LeaderboardPage = () => {
  const { quizId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = useSessionStore(state => state.userId);
  const [search, setSearch] = useState('');
  const top = topOptions.some(option => option.value === searchParams.get('top')) ? searchParams.get('top') : '10';
  const { quizzes, leaderboard, loading } = useLeaderboard(quizId, Number(top), userId);

  const [firstQuiz] = quizzes;
  if (!quizId && firstQuiz) return <Navigate to={`/leaderboard/${firstQuiz.id}`} replace />;

  const handleQuizChange = (value: string | null) => {
    if (value) void navigate({ pathname: `/leaderboard/${value}`, search: searchParams.toString() });
  };

  const handleTopChange = (value: string | null) => {
    if (value) setSearchParams({ top: value });
  };

  return (
    <Stack gap={24}>
      <Flex wrap="wrap" align={{ base: 'stretch', sm: 'flex-end' }} justify="space-between" gap={{ base: 14, sm: 20 }}>
        <Box>
          <Title order={1} fz={{ base: 28, sm: 36 }} lts="-0.01em">
            Leaderboard
          </Title>
          <Text c="dimmed" fz={{ base: 14, sm: 16 }} mt={{ base: 4, sm: 8 }}>
            Best attempt per player. Ties go to the faster time.
          </Text>
        </Box>
        <Group gap={12} wrap="nowrap" align="flex-end">
          <Select
            label="Quiz"
            data={quizzes.map(quiz => ({ value: quiz.id, label: quiz.title }))}
            value={quizId || null}
            onChange={handleQuizChange}
            allowDeselect={false}
            searchable
            limit={20}
            nothingFoundMessage="No quizzes found"
            flex={2}
            miw={0}
            w={{ sm: 260 }}
          />
          <Select
            label="Show"
            data={topOptions}
            value={top}
            onChange={handleTopChange}
            allowDeselect={false}
            flex={1}
            miw={112}
            w={{ sm: 120 }}
          />
        </Group>
      </Flex>

      {loading && (
        <Stack gap={28}>
          <Skeleton h={84} radius="lg" />
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={{ base: 12, sm: 20 }}>
            {[1, 2, 3].map(index => (
              <Skeleton key={index} h={250} radius="lg" />
            ))}
          </SimpleGrid>
        </Stack>
      )}

      {!loading && !leaderboard && (
        <Stack gap="sm" align="flex-start">
          <Text fw={700}>Quiz not found</Text>
          <Text c="dimmed">This quiz doesn't exist or has been removed.</Text>
          <Anchor component={Link} to="/leaderboard" fw={600} display="inline-block" lh="44px">
            Show another leaderboard
          </Anchor>
        </Stack>
      )}

      {!loading && leaderboard && leaderboard.rankedCount === 0 && (
        <Paper withBorder radius="lg" p={24}>
          <Text fw={700} mb={4}>
            No results yet
          </Text>
          <Text c="dimmed" mb={16}>
            No one has completed {leaderboard.quizTitle} yet.
          </Text>
          <Button component={Link} to={`/quizzes/${quizId}`}>
            Start quiz
          </Button>
        </Paper>
      )}

      {!loading && leaderboard && leaderboard.rankedCount > 0 && board(leaderboard, quizId, userId, search, setSearch)}
    </Stack>
  );
};
