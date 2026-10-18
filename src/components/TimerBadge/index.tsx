import { Group, Text } from '@mantine/core';
import { formatClock } from '../../format';
import { isWarning } from '../../hooks/useCountdown';
import classes from './TimerBadge.module.css';
import type { TimerBadgeProps } from './types';

const URGENT_MS = 5000;

export const TimerBadge = ({ scope, remainingMs, limitSeconds, showShortLabel }: TimerBadgeProps) => {
  return (
    <Group
      role="timer"
      className={classes.badge}
      mod={{ warning: isWarning(remainingMs, limitSeconds), urgent: remainingMs > 0 && remainingMs <= URGENT_MS }}
      gap={8}
      wrap="nowrap"
      justify="flex-end"
      mih={{ base: 0, sm: 44 }}
      px={{ base: 8, sm: 14 }}
      bdrs="md"
      fw={600}
    >
      {showShortLabel && (
        <Text component="span" fz={12} c="dimmed" hiddenFrom="sm">
          {scope === 'quiz' ? 'Quiz' : 'Question'}
        </Text>
      )}
      <Text
        component="span"
        ff="monospace"
        fz={{ base: showShortLabel ? 14 : 16, sm: 20 }}
        fw={700}
        inherit={false}
        c="inherit"
      >
        {formatClock(Math.ceil(remainingMs / 1000))}
      </Text>
      <Text component="span" className={classes.label} fz={14} inherit c="inherit">
        {scope === 'quiz' ? `left of ${formatClock(limitSeconds)}` : 'left on this question'}
      </Text>
    </Group>
  );
};
