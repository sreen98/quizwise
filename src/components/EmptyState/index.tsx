import { Box, Stack, Text, ThemeIcon } from '@mantine/core';
import type { EmptyStateProps } from './types';

export const EmptyState = ({ icon, title, children, action }: EmptyStateProps) => {
  return (
    <Stack align="center" ta="center" gap={0} px={16} py={{ base: 32, sm: 48 }}>
      <ThemeIcon variant="light" size={56} radius="xl" mb={16} aria-hidden>
        {icon}
      </ThemeIcon>
      <Box role="status" mb={20}>
        <Text fw={700} fz={18} mb={6}>
          {title}
        </Text>
        <Text c="dimmed" fz={15} maw={420}>
          {children}
        </Text>
      </Box>
      {action}
    </Stack>
  );
};
