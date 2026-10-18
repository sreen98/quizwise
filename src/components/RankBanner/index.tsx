import { Badge, Box, Button, Group, Paper, Progress, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatClock, formatScore, formatSeconds } from '../../format';
import classes from './RankBanner.module.css';
import { standingLine } from './standing';
import type { RankBannerProps } from './types';

const segment = (label: string, children: ReactNode, isWide = false) => (
  <Box className={classes.segment} mod={{ wide: isWide }}>
    <Text fz={12} fw={700} tt="uppercase" lts="0.06em" c="dimmed" mb={4}>
      {label}
    </Text>
    {children}
  </Box>
);

const bigValue = (value: string, rest?: ReactNode) => (
  <Text ff="monospace" fz={24} fw={700} lh={1.2}>
    {value}
    {rest && (
      <Text component="span" ff="var(--mantine-font-family)" fz={14} fw={500} c="dimmed">
        {' '}
        {rest}
      </Text>
    )}
  </Text>
);

const hint = (text: string) => (
  <Text fz={13} c="dimmed" mt={4}>
    {text}
  </Text>
);

export const RankBanner = ({ leaderboard, quizId }: RankBannerProps) => {
  const me = leaderboard.currentUser;
  const showButton = !me || leaderboard.retakesAllowed;

  return (
    <Paper component="section" aria-label="Your standing" withBorder radius="lg" px={{ base: 18, sm: 24 }} py={18}>
      <Box className={classes.segments}>
        {me ? (
          <>
            {segment(
              'Your rank',
              <>
                <Group gap={10}>
                  {bigValue(`#${String(me.rank)}`, `of ${String(leaderboard.rankedCount)}`)}
                  <Badge variant="light">Top {Math.ceil((me.rank / leaderboard.rankedCount) * 100)}%</Badge>
                </Group>
                {hint(standingLine(leaderboard, me))}
              </>,
              true
            )}
            {segment(
              'Score',
              <>
                {bigValue(formatScore(me.score, me.totalQuestions), `${String(me.percentage)}%`)}
                <Progress value={me.percentage} size="sm" mt={8} maw={140} aria-hidden />
              </>
            )}
            {segment(
              'Time',
              <>
                {bigValue(formatClock(me.timeTakenSeconds))}
                {hint(`${formatSeconds(Math.round(me.timeTakenSeconds / me.totalQuestions))} per question`)}
              </>
            )}
          </>
        ) : (
          segment(
            'Your rank',
            <>
              <Text fz={20} fw={700}>
                Not ranked yet
              </Text>
              {hint("You haven't completed this quiz yet.")}
            </>,
            true
          )
        )}
        {showButton && (
          <Stack className={classes.segment} mod="wide" gap={6} align="center" justify="center">
            <Button component={Link} to={`/quizzes/${quizId}`} w={{ base: '100%', sm: 'auto' }}>
              {me ? 'Retake quiz' : 'Start quiz'}
            </Button>
            {me && (
              <Text fz={12} c="dimmed">
                Keeps your best score
              </Text>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
};
