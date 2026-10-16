import { Text, Title } from '@mantine/core';
import { useParams } from 'react-router';

export const LeaderboardPage = () => {
  const { quizId } = useParams();

  return (
    <>
      <Title order={1}>Leaderboard</Title>
      {quizId && <Text c="dimmed">Quiz {quizId}</Text>}
    </>
  );
};
