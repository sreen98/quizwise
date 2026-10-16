import { Text, Title } from '@mantine/core';
import { useParams } from 'react-router';

export const AttemptPage = () => {
  const { attemptId } = useParams();

  return (
    <>
      <Title order={1}>Question</Title>
      <Text c="dimmed">Attempt {attemptId}</Text>
    </>
  );
};
