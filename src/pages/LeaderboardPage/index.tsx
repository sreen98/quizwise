import {
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
import { IconFileOff, IconSearch } from '@tabler/icons-react';
import { useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { EmptyState } from '../../components/EmptyState';
import { MessageCard } from '../../components/MessageCard';
import { PodiumCard } from '../../components/PodiumCard';
import { RankBanner } from '../../components/RankBanner';
import { SearchableSelect } from '../../components/SearchableSelect';
import { PaginatedList } from '../../components/PaginatedList';
import { StandingsList } from '../../components/StandingsList';
import { useDebouncedSearch } from '../../hooks/useDebouncedSearch';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import type { Leaderboard, LeaderboardEntry } from '../../service/types';
import { useSessionStore } from '../../session/sessionStore';

const topOptions = [
  { value: '3', label: 'Top 3' },
  { value: '10', label: 'Top 10' },
  { value: '25', label: 'Top 25' },
  { value: 'all', label: 'All' }
];

const PAGE_SIZE = 10;

const PODIUM_SIZE = 3;

const matchesSearch = (entry: LeaderboardEntry, query: string) =>
  !query || `${entry.userName} ${entry.countryName}`.toLowerCase().includes(query);

interface BoardOptions {
  quizId: string;
  userId: string;
  search: string;
  query: string;
  debouncedSearch: string;
  onSearchChange: (value: string) => void;
  page: number;
  onPageChange: (page: number) => void;
}

const board = (leaderboard: Leaderboard, options: BoardOptions) => {
  const { quizId, userId, search, query, debouncedSearch, onSearchChange, onPageChange } = options;
  const podium = leaderboard.entries.slice(0, PODIUM_SIZE);
  const standings = leaderboard.entries.filter(entry => matchesSearch(entry, query));

  return (
    <Stack gap={28}>
      <RankBanner leaderboard={leaderboard} quizId={quizId} />
      <SimpleGrid
        component="ol"
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
          <Title order={2} fz={20}>
            Standings
          </Title>
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
          <EmptyState
            icon={<IconSearch size={28} />}
            title="No results found"
            action={
              <Button
                variant="default"
                onClick={() => {
                  onSearchChange('');
                }}
              >
                Clear search
              </Button>
            }
          >
            No players match "{debouncedSearch.trim()}".
          </EmptyState>
        ) : (
          <PaginatedList
            items={standings}
            page={options.page}
            pageSize={PAGE_SIZE}
            itemName="player"
            itemsName="players"
            onPageChange={onPageChange}
          >
            {shown => <StandingsList quizTitle={leaderboard.quizTitle} entries={shown} userId={userId} />}
          </PaginatedList>
        )}
      </Stack>
    </Stack>
  );
};

export const LeaderboardPage = () => {
  const { quizId: routeQuizId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = useSessionStore(state => state.userId);
  const { search, setSearch, debouncedSearch, query } = useDebouncedSearch();
  const top = topOptions.some(option => option.value === searchParams.get('top')) ? searchParams.get('top') : '10';
  const limit = top === 'all' ? Number.POSITIVE_INFINITY : Number(top);
  const { quizId: firstQuizId, quizzes, leaderboard, loading } = useLeaderboard(routeQuizId, limit, userId);
  const quizId = routeQuizId || firstQuizId;

  useEffect(() => {
    if (routeQuizId || !firstQuizId) return;
    void navigate({ pathname: `/leaderboard/${firstQuizId}`, search: searchParams.toString() }, { replace: true });
  }, [routeQuizId, firstQuizId, searchParams, navigate]);

  if (!loading && !leaderboard) {
    return (
      <MessageCard
        icon={<IconFileOff size={38} />}
        title="Quiz not found"
        actions={
          <Button component={Link} to="/leaderboard" size="md">
            Show another leaderboard
          </Button>
        }
      >
        This quiz doesn't exist or has been removed.
      </MessageCard>
    );
  }

  const handleQuizChange = (value: string | null) => {
    if (value) void navigate({ pathname: `/leaderboard/${value}`, search: top === '10' ? '' : `?top=${String(top)}` });
  };

  const changePage = (value: number) => {
    const next = new URLSearchParams(searchParams);
    if (value === 1) next.delete('page');
    else next.set('page', String(value));
    setSearchParams(next, { replace: true });
  };

  const handleTopChange = (value: string | null) => {
    if (value) setSearchParams({ top: value });
  };

  return (
    <Stack gap={24}>
      <title>Leaderboard - Quizwise</title>
      <Flex wrap="wrap" align={{ base: 'stretch', sm: 'flex-end' }} justify="space-between" gap={{ base: 14, sm: 20 }}>
        <Box>
          <Title order={1} fz={{ base: 28, sm: 36 }} lts="-0.01em">
            Leaderboard
          </Title>
          <Text c="dimmed" fz={{ base: 14, sm: 16 }} mt={{ base: 4, sm: 8 }}>
            Best attempt per player. Ties go to the faster time.
          </Text>
        </Box>
        <Group gap={12} wrap="nowrap" align="flex-end" w={{ base: '100%', sm: 'auto' }}>
          <Box flex={2} miw={0} w={{ sm: 260 }}>
            <SearchableSelect
              label="Quiz"
              searchLabel="Search quizzes"
              nothingFoundMessage="No quizzes found"
              data={quizzes.map(quiz => ({ value: quiz.id, label: quiz.title }))}
              value={quizId || null}
              onChange={handleQuizChange}
            />
          </Box>
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
          <Skeleton h={{ base: 314, sm: 114 }} radius="lg" />
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={{ base: 12, sm: 20 }}>
            {[1, 2, 3].map(index => (
              <Skeleton key={index} h={{ base: 294, sm: 306 }} radius="lg" />
            ))}
          </SimpleGrid>
          <Stack gap={14}>
            <Skeleton h={{ base: 90, sm: 44 }} radius="md" />
            {[1, 2, 3].map(index => (
              <Skeleton key={index} h={{ base: 96, sm: 56 }} radius="md" />
            ))}
          </Stack>
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

      {!loading &&
        leaderboard &&
        leaderboard.rankedCount > 0 &&
        board(leaderboard, {
          quizId,
          userId,
          search,
          query,
          debouncedSearch,
          onSearchChange: value => {
            setSearch(value);
            changePage(1);
          },
          page: Number(searchParams.get('page')),
          onPageChange: changePage
        })}
    </Stack>
  );
};
