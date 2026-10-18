import { Avatar, Badge, Box, Flex, Group, Paper, Progress, Stack, Table, Text, VisuallyHidden } from '@mantine/core';
import { formatClock, formatDateTime, formatScore } from '../../format';
import type { StandingsListProps } from './types';

const rankChip = (rank: number, isMe: boolean) => (
  <Flex
    w={36}
    h={36}
    align="center"
    justify="center"
    bdrs="md"
    fw={700}
    bg={isMe ? 'blue' : 'var(--surface-2)'}
    c={isMe ? 'var(--filled-ink)' : undefined}
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

export const StandingsList = ({ quizTitle, entries, userId }: StandingsListProps) => {
  return (
    <>
      <Paper withBorder radius="lg" visibleFrom="sm">
        <Table.ScrollContainer minWidth={720} type="native">
          <Table verticalSpacing={14} horizontalSpacing={20} fz={15}>
            <Table.Caption>
              <VisuallyHidden>{quizTitle} standings</VisuallyHidden>
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
                      {formatScore(entry.score, entry.totalQuestions)}
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
                        {formatScore(entry.score, entry.totalQuestions)}
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
    </>
  );
};
