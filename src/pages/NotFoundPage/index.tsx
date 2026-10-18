import { Button } from '@mantine/core';
import { IconCompassOff } from '@tabler/icons-react';
import { Link } from 'react-router';
import { MessageCard } from '../../components/MessageCard';

export const NotFoundPage = () => {
  return (
    <MessageCard
      icon={<IconCompassOff size={38} />}
      title="Page not found"
      actions={
        <Button component={Link} to="/quizzes" size="md">
          Back to quizzes
        </Button>
      }
    >
      This page doesn't exist. It may have been moved or the link is wrong.
    </MessageCard>
  );
};
