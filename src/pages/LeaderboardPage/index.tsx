import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Group,
  Paper,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  VisuallyHidden
} from '@mantine/core';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { formatClock, formatDateTime } from '../../format';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import type { Leaderboard, LeaderboardEntry } from '../../service/types';
import { useSessionStore } from '../../session/sessionStore';
import classes from './LeaderboardPage.module.css';
import { standingLine } from './standing';

const topOptions = [
  { value: '3', label: 'Top 3' },
  { value: '10', label: 'Top 10' },
  { value: '25', label: 'Top 25' }
];

const PODIUM_SIZE = 3;
const places = ['1st', '2nd', '3rd'];

const scoreText = (entry: LeaderboardEntry) => `${String(entry.score)}/${String(entry.totalQuestions)}`;

const rankChip = (rank: number, isMe: boolean) => (
  <Flex
    w={36}
    h={36}
    align="center"
    justify="center"
    bdrs="md"
    fw={700}
    bg={isMe ? 'blue' : 'var(--surface-2)'}
    c={isMe ? 'white' : undefined}
    bd={isMe ? undefined : '1px solid var(--mantine-color-default-border)'}
  >
    <VisuallyHidden>Rank </VisuallyHidden>
    {rank}
  </Flex>
);

const youBadge = (
  <Badge variant="filled" size="xs">
    You
  </Badge>
);

const rankBanner = (leaderboard: Leaderboard, quizId: string) => {
  const me = leaderboard.currentUser;
  const showButton = !me || leaderboard.retakesAllowed;

  return (
    <Paper
      component="section"
      aria-label="Your standing"
      radius="lg"
      bd="2px solid var(--mantine-primary-color-filled)"
      px={{ base: 18, sm: 24 }}
      py={16}
    >
      <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} gap={16}>
        <Box flex={1} miw={0}>
          {me ? (
            <>
              <Group gap={10}>
                <Text fz={18} fw={700}>
                  Your rank: #{me.rank} of {leaderboard.rankedCount}
                </Text>
                <Badge>Top {Math.ceil((me.rank / leaderboard.rankedCount) * 100)}%</Badge>
              </Group>
              <Text c="dimmed" fz={14} mt={4}>
                {standingLine(leaderboard, me)}
              </Text>
            </>
          ) : (
            <>
              <Text fz={18} fw={700}>
                Your rank: not ranked yet
              </Text>
              <Text c="dimmed" fz={14} mt={4}>
                You haven't completed this quiz yet.
              </Text>
            </>
          )}
        </Box>
        <Group gap={20} justify="space-between">
          {me && (
            <Box ta={{ base: 'left', sm: 'right' }}>
              <Text fz={12} fw={700} tt="uppercase" lts="0.06em" c="dimmed">
                Current standing
              </Text>
              <Text ff="monospace" fz={22} fw={700}>
                {scoreText(me)}
              </Text>
            </Box>
          )}
          {showButton && (
            <Button component={Link} to={`/quizzes/${quizId}`}>
              {me ? 'Retake quiz' : 'Start quiz'}
            </Button>
          )}
        </Group>
      </Flex>
    </Paper>
  );
};

const podiumCard = (entry: LeaderboardEntry, isMe: boolean) => {
  const isFirst = entry.rank === 1;

  return (
    <Paper
      component="li"
      key={entry.userId}
      className={classes.place}
      data-place={entry.rank}
      display="block"
      radius="lg"
      withBorder={!isFirst}
      bd={isFirst ? '2px solid var(--mantine-primary-color-filled)' : undefined}
      bg={isMe ? 'var(--accent-soft)' : undefined}
      px={{ base: 18, sm: 22 }}
      py={{ base: 18, sm: isFirst ? 30 : 22 }}
      aria-current={isMe || undefined}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb={14}>
        <Stack gap={4} align="center">
          <Avatar
            aria-hidden
            name={entry.userName}
            color="blue"
            variant={isFirst ? 'filled' : 'light'}
            size={isFirst ? 60 : 48}
          />
          <Badge size="sm" variant={isFirst ? 'filled' : 'light'}>
            {places[entry.rank - 1]}
          </Badge>
        </Stack>
        <Group gap={6} justify="flex-end">
          {isMe && youBadge}
          <Badge variant="default">{entry.countryName}</Badge>
        </Group>
      </Group>
      <Text fw={700} fz={isFirst ? 22 : 18} truncate>
        {entry.userName}
      </Text>
      <Paper bg="var(--surface-2)" radius="md" p={14} mt={14}>
        <SimpleGrid cols={2} spacing={12}>
          <Box>
            <Text fz={12} c="dimmed">
              Score (accuracy)
            </Text>
            <Text ff="monospace" fz={isFirst ? 28 : 22} fw={700} lh={1.2}>
              {scoreText(entry)}{' '}
              <Text component="span" fz={13} c="dimmed" ff="var(--mantine-font-family)" fw={500}>
                / {entry.percentage}%
              </Text>
            </Text>
          </Box>
          <Box>
            <Text fz={12} c="dimmed">
              Time taken
            </Text>
            <Text ff="monospace" fz={isFirst ? 22 : 18} fw={700} lh={1.4}>
              {formatClock(entry.timeTakenSeconds)}
            </Text>
          </Box>
        </SimpleGrid>
      </Paper>
      <Text fz={13} c="dimmed" mt={14}>
        {entry.completedAt ? `Completed ${formatDateTime(entry.completedAt)}` : ''}
      </Text>
    </Paper>
  );
};

const matchesSearch = (entry: LeaderboardEntry, search: string) => {
  const query = search.trim().toLowerCase();
  return !query || `${entry.userName} ${entry.countryName}`.toLowerCase().includes(query);
};

const standingsTable = (leaderboard: Leaderboard, entries: LeaderboardEntry[], userId: string) => (
  <Paper withBorder radius="lg" visibleFrom="sm">
    <Table.ScrollContainer minWidth={720} type="native">
      <Table verticalSpacing={14} horizontalSpacing={20} fz={15}>
        <Table.Caption>
          <VisuallyHidden>{leaderboard.quizTitle} standings</VisuallyHidden>
        </Table.Caption>
        <Table.Thead>
          <Table.Tr>
            {['Rank', 'Player', 'Country', 'Score', 'Accuracy', 'Time', 'Completed'].map(label => (
              <Table.Th key={label} fz={12} fw={700} tt="uppercase" lts="0.06em" c="dimmed">
                {label}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {entries.map(entry => {
            const isMe = entry.userId === userId;
            return (
              <Table.Tr
                key={entry.userId}
                bg={isMe ? 'var(--accent-soft)' : undefined}
                aria-current={isMe || undefined}
              >
                <Table.Td w={80}>{rankChip(entry.rank, isMe)}</Table.Td>
                <Table.Td>
                  <Group gap={10} wrap="nowrap">
                    <Avatar aria-hidden name={entry.userName} color="blue" variant="light" size={32} />
                    <Text fw={700} inherit>
                      {entry.userName}
                    </Text>
                    {isMe && youBadge}
                  </Group>
                </Table.Td>
                <Table.Td c="dimmed">{entry.countryName}</Table.Td>
                <Table.Td fw={700} ff="monospace">
                  {scoreText(entry)}
                </Table.Td>
                <Table.Td>
                  <Group gap={10} wrap="nowrap">
                    <Progress value={entry.percentage} w={80} size="sm" aria-hidden />
                    <Text inherit>{entry.percentage}%</Text>
                  </Group>
                </Table.Td>
                <Table.Td ff="monospace">{formatClock(entry.timeTakenSeconds)}</Table.Td>
                <Table.Td c="dimmed">{entry.completedAt ? formatDateTime(entry.completedAt) : ''}</Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  </Paper>
);

const standingsCards = (entries: LeaderboardEntry[], userId: string) => (
  <Stack component="ol" gap={10} m={0} p={0} hiddenFrom="sm" aria-label="Standings">
    {entries.map(entry => {
      const isMe = entry.userId === userId;
      return (
        <Paper
          component="li"
          key={entry.userId}
          display="block"
          withBorder
          radius="lg"
          px={14}
          py={12}
          bg={isMe ? 'var(--accent-soft)' : undefined}
          aria-current={isMe || undefined}
        >
          <Group gap={12} wrap="nowrap">
            {rankChip(entry.rank, isMe)}
            <Box flex={1} miw={0}>
              <Group gap={8} wrap="nowrap">
                <Text fw={700} truncate>
                  {entry.userName}
                </Text>
                {isMe && youBadge}
              </Group>
              <Text fz={13} c="dimmed">
                {entry.countryName}
              </Text>
              <Group gap={16} fz={14} c="dimmed" mt={4}>
                <span>
                  <Text component="b" ff="monospace" c="var(--mantine-color-text)" fw={700} inherit>
                    {scoreText(entry)}
                  </Text>{' '}
                  · {entry.percentage}%
                </span>
                <span>
                  Time{' '}
                  <Text component="b" ff="monospace" c="var(--mantine-color-text)" fw={700} inherit>
                    {formatClock(entry.timeTakenSeconds)}
                  </Text>
                </span>
              </Group>
            </Box>
          </Group>
        </Paper>
      );
    })}
  </Stack>
);

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
      {rankBanner(leaderboard, quizId)}
      <SimpleGrid
        component="ol"
        className={classes.podium}
        cols={{ base: 1, sm: 3 }}
        spacing={{ base: 12, sm: 20 }}
        m={0}
        p={0}
        aria-label="Top players"
      >
        {podium.map(entry => podiumCard(entry, entry.userId === userId))}
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
          <>
            {standingsTable(leaderboard, standings, userId)}
            {standingsCards(standings, userId)}
          </>
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
