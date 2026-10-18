import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFileOff } from '@tabler/icons-react';
import { Link, useNavigate, useParams } from 'react-router';
import { MessageCard } from '../../../components/MessageCard';
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
      <MessageCard
        icon={<IconFileOff size={38} />}
        title="Quiz not found"
        actions={
          <Button component={Link} to="/admin" size="md">
            Back to Manage quizzes
          </Button>
        }
      >
        This quiz doesn't exist or has been removed.
      </MessageCard>
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
    <>
      <title>{quizId ? 'Edit quiz - Quizwise' : 'New quiz - Quizwise'}</title>
      <QuizForm
        key={quizId ?? 'new'}
        initialValues={state.quiz}
        countries={state.countries}
        isNew={!quizId}
        onSubmit={handleSubmit}
      />
    </>
  );
};
