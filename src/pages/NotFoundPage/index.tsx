import { Anchor, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router';

export const NotFoundPage = () => {
  return (
    <Stack gap="sm" align="flex-start">
      <title>Page not found - Quizwise</title>
      <Title order={1}>Page not found</Title>
      <Text c="dimmed">This page doesn't exist. It may have been moved or the link is wrong.</Text>
      <Anchor component={Link} to="/quizzes" fw={600} display="inline-block" lh="44px">
        Back to quizzes
      </Anchor>
    </Stack>
  );
};
