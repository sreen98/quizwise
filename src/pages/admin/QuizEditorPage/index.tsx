import { Title } from '@mantine/core';
import { useParams } from 'react-router';

export const QuizEditorPage = () => {
  const { quizId } = useParams();

  return <Title order={1}>{quizId ? 'Edit quiz' : 'New quiz'}</Title>;
};
