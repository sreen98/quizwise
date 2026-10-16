import { Anchor, Box, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router';

export const RouteError = () => {
  return (
    <Box component="main" maw={1200} mx="auto" px={{ base: 16, sm: 24 }} py={40}>
      <Stack gap="sm" align="flex-start">
        <Title order={1}>Something went wrong</Title>
        <Text c="dimmed">The page could not be shown. Try again from the quiz list.</Text>
        <Anchor component={Link} to="/quizzes" fw={600}>
          Back to quizzes
        </Anchor>
      </Stack>
    </Box>
  );
};
