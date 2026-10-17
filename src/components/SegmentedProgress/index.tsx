import { Box, SimpleGrid } from '@mantine/core';
import type { SegmentedProgressProps } from './types';

export const SegmentedProgress = ({ total, answered }: SegmentedProgressProps) => {
  return (
    <SimpleGrid
      role="progressbar"
      aria-label="Quiz progress"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={answered}
      cols={total}
      spacing={6}
    >
      {Array.from({ length: total }, (_, index) => (
        <Box
          key={index}
          h={6}
          bdrs="lg"
          bg={index <= answered ? 'blue' : 'var(--mantine-color-default-border)'}
          opacity={index === answered ? 0.4 : 1}
        />
      ))}
    </SimpleGrid>
  );
};
