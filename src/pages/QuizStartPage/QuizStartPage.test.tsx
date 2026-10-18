import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { quizService } from '../../service/quizService';
import { useSessionStore } from '../../session/sessionStore';
import { renderRoute } from '../../test/renderWithProviders';

const asUser = (userId: string) => {
  useSessionStore.setState({ userId, country: null, slowNetwork: false });
};

describe('QuizStartPage', () => {
  beforeEach(async () => {
    asUser('u1');
    await quizService.resetData();
  });

  it('shows the quiz details and the rules before starting', async () => {
    renderRoute('/quizzes/q4');

    expect(await screen.findByRole('heading', { level: 1, name: 'Kerala Culture and History' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Available in India' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Not now' })).not.toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
    expect(screen.getByText('Only once')).toBeInTheDocument();
    expect(screen.getByText('Single and multiple choice')).toBeInTheDocument();
    expect(screen.getByText(/You have 3 min\. The timer starts when you press Start/)).toBeInTheDocument();
    expect(screen.getByText('This quiz can only be taken once.')).toBeInTheDocument();
  });

  it('starts a new attempt and opens it', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/quizzes/q4');

    await user.click(await screen.findByRole('button', { name: 'Start quiz' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/attempts\/[\w-]+$/);
    });
  });

  it('resumes the attempt that is already in progress', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/quizzes/q3');

    await user.click(await screen.findByRole('button', { name: 'Resume quiz' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/attempts/a11');
    });
  });

  it('shows the previous result instead when the quiz cannot be retaken', async () => {
    const { router } = renderRoute('/quizzes/q2');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/attempts/a5/results');
    });
  });

  it('says when a quiz does not exist', async () => {
    renderRoute('/quizzes/q99');

    expect(await screen.findByRole('heading', { name: 'Quiz not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to quizzes' })).toHaveAttribute('href', '/quizzes');
  });
});
