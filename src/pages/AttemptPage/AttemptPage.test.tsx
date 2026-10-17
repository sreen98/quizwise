import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { quizService } from '../../service/quizService';
import { useSessionStore } from '../../session/sessionStore';
import { renderRoute } from '../../test/renderWithProviders';

const startQuiz = async () => {
  const { attemptId } = await quizService.startOrResumeAttempt('q1', 'u5');
  return attemptId;
};

const firstOption = () => {
  const [option] = [...screen.queryAllByRole('radio'), ...screen.queryAllByRole('checkbox')];
  if (!option) throw new Error('The question has no options');
  return option;
};

describe('AttemptPage', () => {
  beforeEach(async () => {
    useSessionStore.setState({ userId: 'u5', country: null, slowNetwork: false });
    await quizService.resetData();
  });

  it('shows the first question with the quiz title and progress', async () => {
    renderRoute(`/attempts/${await startQuiz()}`);

    expect(
      await screen.findByRole('heading', {
        name: 'Which keyword declares a block-scoped variable that cannot be reassigned?'
      })
    ).toBeInTheDocument();
    expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 6')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Quiz progress' })).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('keeps Submit answer disabled until an option is selected', async () => {
    const user = userEvent.setup();
    renderRoute(`/attempts/${await startQuiz()}`);

    const submit = await screen.findByRole('button', { name: 'Submit answer' });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: 'const' }));

    expect(submit).toBeEnabled();
  });

  it('moves to the next question after submitting', async () => {
    const user = userEvent.setup();
    renderRoute(`/attempts/${await startQuiz()}`);

    await user.click(await screen.findByRole('radio', { name: 'const' }));
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));

    expect(await screen.findByText('Question 2 of 6')).toBeInTheDocument();
    expect(screen.getByText('1 answered')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What does typeof null return?' })).toBeInTheDocument();
  });

  it('submits the answer when Enter is pressed', async () => {
    const user = userEvent.setup();
    renderRoute(`/attempts/${await startQuiz()}`);

    await user.click(await screen.findByRole('radio', { name: 'const' }));
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Question 2 of 6')).toBeInTheDocument();
  });

  it('opens the results after the last question', async () => {
    const user = userEvent.setup();
    const attemptId = await startQuiz();
    const { router } = renderRoute(`/attempts/${attemptId}`);

    for (let number = 1; number <= 6; number++) {
      await screen.findByText(`Question ${String(number)} of 6`);
      await user.click(firstOption());
      await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    }

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/attempts/${attemptId}/results`);
    });
  });

  it('says when an attempt does not exist', async () => {
    renderRoute('/attempts/a99');

    expect(await screen.findByRole('heading', { name: 'Attempt not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to quizzes' })).toHaveAttribute('href', '/quizzes');
  });
});
