import { Box } from '@mantine/core';
import type { FlagProps } from './types';

export const Flag = ({ code }: FlagProps) => (
  <Box
    component="span"
    className={`fi fis fi-${code.toLowerCase()}`}
    w={20}
    h={20}
    lh={0}
    bdrs="50%"
    bd="1px solid var(--mantine-color-default-border)"
    aria-hidden
  />
);
