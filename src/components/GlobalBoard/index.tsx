import { Button, Paper, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconTrophy } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatClock } from '../../format';
import { useGlobalLeaderboard } from '../../hooks/useGlobalLeaderboard';
import { EmptyState } from '../EmptyState';
import { GlobalStandings } from '../GlobalStandings';
import { PaginatedList } from '../PaginatedList';
import type { GlobalBoardProps } from './types';

const PAGE_SIZE = 10;

const stat = (label: string, value: ReactNode) => (
  <div>
    <Text fz={12} fw={700} tt="uppercase" lts="0.06em" c="dimmed" mb={4}>
      {label}
    </Text>
    <Text ff="monospace" fz={24} fw={700} lh={1.2}>
      {value}
    </Text>
  </div>
);

export const GlobalBoard = ({ limit, userId, page, onPageChange }: GlobalBoardProps) => {
  const { leaderboard, loading } = useGlobalLeaderboard(limit, userId);

  if (loading) {
    return (
      <Stack gap={28}>
        <Skeleton h={{ base: 152, sm: 96 }} radius="lg" />
        <Stack gap={14}>
          <Skeleton h={28} w={160} radius="md" />
          {[1, 2, 3].map(index => (
            <Skeleton key={index} h={{ base: 76, sm: 56 }} radius="md" />
          ))}
        </Stack>
      </Stack>
    );
  }

  if (!leaderboard || leaderboard.rankedCount === 0) {
    return (
      <EmptyState
        icon={<IconTrophy size={28} />}
        title="No results yet"
        action={
          <Button component={Link} to="/quizzes">
            Browse quizzes
          </Button>
        }
      >
        No one has completed a quiz yet.
      </EmptyState>
    );
  }

  const me = leaderboard.currentUser;

  return (
    <Stack gap={28}>
      <Paper
        component="section"
        aria-label="Your global standing"
        withBorder
        radius="lg"
        px={{ base: 18, sm: 24 }}
        py={18}
      >
        {me ? (
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing={16} verticalSpacing={18}>
            {stat(
              'Global rank',
              <>
                #{me.rank}
                <Text component="span" ff="var(--mantine-font-family)" fz={14} fw={500} c="dimmed">
                  {' '}
                  of {leaderboard.rankedCount}
                </Text>
              </>
            )}
            {stat('Total score', me.totalScore)}
            {stat('Quizzes', me.quizzesCompleted)}
            {stat('Total time', formatClock(me.totalTimeSeconds))}
          </SimpleGrid>
        ) : (
          <>
            <Text fz={20} fw={700}>
              Not ranked yet
            </Text>
            <Text fz={13} c="dimmed" mt={4}>
              Complete a quiz to get a global rank.
            </Text>
          </>
        )}
      </Paper>
      <Stack gap={14}>
        <Title order={2} fz={20}>
          Global standings
        </Title>
        <PaginatedList
          items={leaderboard.entries}
          page={page}
          pageSize={PAGE_SIZE}
          itemName="player"
          itemsName="players"
          onPageChange={onPageChange}
        >
          {shown => <GlobalStandings entries={shown} userId={userId} />}
        </PaginatedList>
      </Stack>
    </Stack>
  );
};
