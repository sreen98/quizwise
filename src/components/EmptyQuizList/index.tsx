import { Button, Paper, Stack, Text, Title } from '@mantine/core';
import type { EmptyQuizListProps } from './types';

export const EmptyQuizList = ({ countryName, onShowAll }: EmptyQuizListProps) => {
  return (
    <Paper
      component="section"
      aria-labelledby="empty-quizzes-title"
      radius="lg"
      bg="transparent"
      bd="2px dashed var(--mantine-color-default-border)"
      mt={32}
      px={24}
      py={36}
    >
      <Stack align="center" ta="center" gap={0}>
        <Title id="empty-quizzes-title" order={2} fz={21} mb={10}>
          No quizzes here yet
        </Title>
        <Text c="dimmed" fz={15} mb={24}>
          There aren't any quizzes assigned to {countryName} right now. Try another country, or check back later.
        </Text>
        <Button onClick={onShowAll}>Show all countries</Button>
      </Stack>
    </Paper>
  );
};
