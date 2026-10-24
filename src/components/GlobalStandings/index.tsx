import { Avatar, Badge, Box, Flex, Group, Paper, Stack, Table, Text, VisuallyHidden } from '@mantine/core';
import { formatClock, formatCount } from '../../format';
import type { GlobalLeaderboardEntry } from '../../service/types';
import { CountryFlags } from '../CountryFlags';
import type { GlobalStandingsProps } from './types';

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

const NUMBER_COLUMNS = ['Total score', 'Quizzes', 'Total time'];

const flag = (entry: GlobalLeaderboardEntry) => (
  <CountryFlags codes={[entry.country]} countries={[{ code: entry.country, name: entry.countryName }]} />
);

const youBadge = (
  <Badge variant="filled" size="xs">
    You
  </Badge>
);

const strong = (text: string) => (
  <Text component="b" ff="monospace" c="var(--mantine-color-text)" fw={700} inherit>
    {text}
  </Text>
);

export const GlobalStandings = ({ entries, userId }: GlobalStandingsProps) => (
  <>
    <Paper withBorder radius="lg" visibleFrom="sm">
      <Table.ScrollContainer minWidth={640} type="native">
        <Table verticalSpacing={14} horizontalSpacing={20} fz={15}>
          <Table.Caption>
            <VisuallyHidden>Global standings</VisuallyHidden>
          </Table.Caption>
          <Table.Thead>
            <Table.Tr>
              {['Rank', 'Player', 'Country', ...NUMBER_COLUMNS].map(label => (
                <Table.Th
                  key={label}
                  ta={NUMBER_COLUMNS.includes(label) ? 'right' : undefined}
                  fz={12}
                  fw={700}
                  tt="uppercase"
                  lts="0.06em"
                  c="dimmed"
                >
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
                  <Table.Td>{flag(entry)}</Table.Td>
                  <Table.Td fw={700} ff="monospace" ta="right">
                    {entry.totalScore}
                  </Table.Td>
                  <Table.Td ff="monospace" ta="right">
                    {entry.quizzesCompleted}
                  </Table.Td>
                  <Table.Td ff="monospace" ta="right">
                    {formatClock(entry.totalTimeSeconds)}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>

    <Stack component="ol" gap={10} m={0} p={0} hiddenFrom="sm" aria-label="Global standings">
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
                  {flag(entry)}
                  <Text fw={700} truncate>
                    {entry.userName}
                  </Text>
                  {isMe && youBadge}
                </Group>
                <Group gap={16} fz={14} c="dimmed" mt={4}>
                  <span>Score {strong(String(entry.totalScore))}</span>
                  <span>{formatCount(entry.quizzesCompleted, 'quiz', 'quizzes')}</span>
                  <span>Time {strong(formatClock(entry.totalTimeSeconds))}</span>
                </Group>
              </Box>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  </>
);
