import { Text, Title } from '@mantine/core';
import { useParams } from 'react-router';

export const QuizStartPage = () => {
  const { quizId } = useParams();

  return (
    <>
      <Title order={1}>Start quiz</Title>
      <Text c="dimmed">Quiz {quizId}</Text>
    </>
  );
};
