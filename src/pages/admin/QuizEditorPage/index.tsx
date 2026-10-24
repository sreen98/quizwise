import { Button, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconFileOff } from '@tabler/icons-react';
import { Link, useNavigate, useParams } from 'react-router';
import { formatCount } from '../../../format';
import { MessageCard } from '../../../components/MessageCard';
import { QuizForm } from '../../../components/QuizForm';
import { QuizFormSkeleton } from '../../../components/QuizFormSkeleton';
import { useQuizEditor } from '../../../hooks/useQuizEditor';
import type { QuizInput } from '../../../types/models';

const confirmEndAttempts = (count: number) =>
  new Promise<boolean>(resolve => {
    modals.openConfirmModal({
      title: 'End attempts in progress?',
      children: (
        <Text size="sm">
          {formatCount(count, 'attempt')} in progress will end, because the questions or time limits changed.
        </Text>
      ),
      labels: { confirm: 'Yes', cancel: 'Cancel' },
      confirmProps: { color: 'orange' },
      onConfirm: () => {
        resolve(true);
      },
      onClose: () => {
        resolve(false);
      }
    });
  });

export const QuizEditorPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { state, save, countEndedAttempts } = useQuizEditor(quizId);

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
      const endedCount = await countEndedAttempts(values);
      if (endedCount > 0 && !(await confirmEndAttempts(endedCount))) return;
      await save(values);
    } catch {
      notifications.show({
        color: 'orange',
        message: "Couldn't save the quiz. It may have been deleted."
      });
      return;
    }
    notifications.show({ message: quizId ? 'Quiz saved' : 'Quiz created' });
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
