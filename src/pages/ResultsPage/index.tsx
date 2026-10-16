import { Text, Title } from '@mantine/core';
import { useParams } from 'react-router';

export const ResultsPage = () => {
  const { attemptId } = useParams();

  return (
    <>
      <Title order={1}>Results</Title>
      <Text c="dimmed">Attempt {attemptId}</Text>
    </>
  );
};
