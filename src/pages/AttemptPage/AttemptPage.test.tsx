import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quizService } from '../../service/quizService';
import { useSessionStore } from '../../session/sessionStore';
import { renderRoute } from '../../test/renderWithProviders';

const startQuiz = async (quizId = 'q1') => {
  const { attemptId } = await quizService.startOrResumeAttempt(quizId, 'u5');
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

  it('moves focus to the question when the page loads', async () => {
    renderRoute(`/attempts/${await startQuiz()}`);

    const heading = await screen.findByRole('heading', {
      name: 'Which keyword declares a block-scoped variable that cannot be reassigned?'
    });
    await waitFor(() => {
      expect(heading).toHaveFocus();
    });
  });

  it('moves focus to the next question after submitting', async () => {
    const user = userEvent.setup();
    renderRoute(`/attempts/${await startQuiz()}`);

    await user.click(await screen.findByRole('radio', { name: 'const' }));
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));

    const heading = await screen.findByRole('heading', { name: 'What does typeof null return?' });
    await waitFor(() => {
      expect(heading).toHaveFocus();
    });
  });

  it('reaches the options with Tab from the focused question', async () => {
    const user = userEvent.setup();
    renderRoute(`/attempts/${await startQuiz()}`);
    const heading = await screen.findByRole('heading', {
      name: 'Which keyword declares a block-scoped variable that cannot be reassigned?'
    });
    await waitFor(() => {
      expect(heading).toHaveFocus();
    });

    await user.tab();

    expect(screen.getByRole('radio', { name: 'var' })).toHaveFocus();
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

  describe('timers', () => {
    const advance = async (milliseconds: number) => {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(milliseconds);
      });
    };

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows the time left for the whole quiz', async () => {
      renderRoute(`/attempts/${await startQuiz()}`);

      expect(await screen.findByRole('timer')).toHaveTextContent('5:00left of 5:00');
    });

    it('shows both timers when a quiz has an overall and a per question limit', async () => {
      renderRoute(`/attempts/${await startQuiz('q5')}`);

      const [quizTimer, questionTimer] = await screen.findAllByRole('timer');
      expect(quizTimer).toHaveTextContent('6:00left of 6:00');
      expect(questionTimer).toHaveTextContent('0:45left on this question');
    });

    it('warns 10 seconds before a 30 second question runs out', async () => {
      renderRoute(`/attempts/${await startQuiz('q2')}`);
      const timer = await screen.findByRole('timer');

      await advance(19_000);
      expect(timer).not.toHaveAttribute('data-warning');
      expect(screen.queryByText(/seconds left/)).not.toBeInTheDocument();

      await advance(1_000);
      expect(timer).toHaveAttribute('data-warning');
      expect(
        screen.getByText('10 seconds left. Your selection will be submitted automatically when time runs out.')
      ).toBeInTheDocument();
    });

    it('submits the selection and moves on when the question runs out of time', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderRoute(`/attempts/${await startQuiz('q2')}`);

      await user.click(await screen.findByRole('radio', { name: 'useEffect' }));
      await advance(30_000);

      expect(await screen.findByText('Question 2 of 7')).toBeInTheDocument();
      expect(screen.getByText('1 answered')).toBeInTheDocument();
    });

    it('shows no timer for an untimed quiz', async () => {
      const quiz = await quizService.getQuizForEdit('q1');
      const untimed = await quizService.createQuiz({ ...quiz, timeLimitSeconds: null, perQuestionSeconds: null });
      renderRoute(`/attempts/${await startQuiz(untimed.id)}`);

      expect(await screen.findByText('Question 1 of 6')).toBeInTheDocument();
      expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    });
  });
});
