import { Box, SimpleGrid } from '@mantine/core';
import type { SegmentedProgressProps } from './types';

const segmentColor = (index: number, answered: boolean[]) => {
  if (index >= answered.length) return index === answered.length ? 'blue' : 'var(--mantine-color-default-border)';
  return answered[index] ? 'blue' : 'orange.4';
};

export const SegmentedProgress = ({ total, answered }: SegmentedProgressProps) => {
  const answeredCount = answered.filter(Boolean).length;

  return (
    <SimpleGrid
      role="progressbar"
      aria-label="Quiz progress"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={answered.length}
      aria-valuetext={`${String(answeredCount)} answered, ${String(answered.length - answeredCount)} missed, ${String(total - answered.length)} to go`}
      cols={total}
      spacing={6}
    >
      {Array.from({ length: total }, (_, index) => (
        <Box
          key={index}
          h={6}
          bdrs="lg"
          bg={segmentColor(index, answered)}
          opacity={index === answered.length ? 0.4 : 1}
        />
      ))}
    </SimpleGrid>
  );
};
