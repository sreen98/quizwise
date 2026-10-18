import { Anchor, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Link, useNavigate, useParams } from 'react-router';
import { QuizForm } from '../../../components/QuizForm';
import { QuizFormSkeleton } from '../../../components/QuizFormSkeleton';
import { useQuizEditor } from '../../../hooks/useQuizEditor';
import type { QuizInput } from '../../../types/models';

export const QuizEditorPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { state, save } = useQuizEditor(quizId);

  if (state.status === 'missing') {
    return (
      <Stack gap="sm" align="flex-start">
        <Title order={1}>Quiz not found</Title>
        <Text c="dimmed">This quiz doesn't exist or has been removed.</Text>
        <Anchor component={Link} to="/admin" fw={600} display="inline-block" lh="44px">
          Back to Manage quizzes
        </Anchor>
      </Stack>
    );
  }

  if (state.status === 'loading') {
    return <QuizFormSkeleton isNew={!quizId} />;
  }

  const handleSubmit = async (values: QuizInput) => {
    try {
      await save(values);
    } catch {
      notifications.show({
        color: 'orange',
        message: `Couldn't save ${values.title}. The quiz may have been deleted.`
      });
      return;
    }
    notifications.show({ message: quizId ? `${values.title} saved` : `${values.title} created` });
    await navigate('/admin');
  };

  return (
    <QuizForm
      key={quizId ?? 'new'}
      initialValues={state.quiz}
      countries={state.countries}
      isNew={!quizId}
      onSubmit={handleSubmit}
    />
  );
};
