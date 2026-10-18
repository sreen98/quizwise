import { Box, Button } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Link } from 'react-router';
import { MessageCard } from '../MessageCard';

export const RouteError = () => {
  return (
    <Box component="main" px={{ base: 16, sm: 24 }} py={{ base: 16, sm: 24 }}>
      <MessageCard
        icon={<IconAlertTriangle size={38} />}
        color="orange"
        title="Something went wrong"
        actions={
          <Button component={Link} to="/quizzes" size="md">
            Back to quizzes
          </Button>
        }
      >
        The page could not be shown. Try again from the quiz list.
      </MessageCard>
    </Box>
  );
};
