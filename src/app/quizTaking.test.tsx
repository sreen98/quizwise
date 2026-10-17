import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quizService } from '../service/quizService';
import { useSessionStore } from '../session/sessionStore';
import { renderRoute } from '../test/renderWithProviders';

const cardFor = async (title: string) => {
  const heading = await screen.findByRole('heading', { name: title });
  const card = heading.closest('article');
  if (!card) throw new Error(`No card for ${title}`);
  return within(card);
};

const firstOption = () => {
  const [option] = [...screen.queryAllByRole('radio'), ...screen.queryAllByRole('checkbox')];
  if (!option) throw new Error('The question has no options');
  return option;
};

describe('taking a quiz', () => {
  beforeEach(async () => {
    useSessionStore.setState({ userId: 'u5', country: null, slowNetwork: false });
    await quizService.resetData();
  });

  it('goes from the quiz list through every question to the results', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/quizzes');

    await user.click((await cardFor('JavaScript Basics')).getByRole('link', { name: 'Start' }));
    await user.click(await screen.findByRole('button', { name: 'Start quiz' }));

    for (let number = 1; number <= 6; number++) {
      await screen.findByText(`Question ${String(number)} of 6`);
      await user.click(firstOption());
      await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    }

    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/attempts\/[\w-]+\/results$/);
    });
  });

  it('records an answer only once when Submit is pressed twice', async () => {
    const user = userEvent.setup();
    const { attemptId } = await quizService.startOrResumeAttempt('q1', 'u5');
    renderRoute(`/attempts/${attemptId}`);

    await user.click(await screen.findByRole('radio', { name: 'const' }));
    await user.dblClick(screen.getByRole('button', { name: 'Submit answer' }));

    expect(await screen.findByText('Question 2 of 6')).toBeInTheDocument();
    expect(screen.getByText('1 answered')).toBeInTheDocument();
  });

  describe('after leaving and coming back', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('resumes at the same question with the saved selection and the time still running', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { attemptId } = await quizService.startOrResumeAttempt('q1', 'u5');
      const first = renderRoute(`/attempts/${attemptId}`);

      await user.click(await screen.findByRole('radio', { name: 'const' }));
      await user.click(screen.getByRole('button', { name: 'Submit answer' }));
      await user.click(await screen.findByRole('radio', { name: '"object"' }));
      first.unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(60_000);
      });
      renderRoute(`/attempts/${attemptId}`);

      expect(await screen.findByText('Question 2 of 6')).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: '"object"' })).toBeChecked();
      expect(screen.getByRole('timer')).toHaveTextContent(/4:0\dleft of 5:00/);
    });
  });
});
