import { Badge, Box, Button, Flex, Group, Paper, Text } from '@mantine/core';
import { Link } from 'react-router';
import { formatScore } from '../../format';
import { standingLine } from './standing';
import type { RankBannerProps } from './types';

export const RankBanner = ({ leaderboard, quizId }: RankBannerProps) => {
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
                {formatScore(me.score, me.totalQuestions)}
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
