import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { quizService } from '../../service/quizService';
import { useSessionStore } from '../../session/sessionStore';
import { renderRoute } from '../../test/renderWithProviders';

describe('AttemptEndedPage', () => {
  beforeEach(async () => {
    useSessionStore.setState({ userId: 'u1', countryFilter: null, slowNetwork: false });
    await quizService.resetData();
  });

  it('explains that time ran out while the user was away', async () => {
    const { router } = renderRoute('/attempts/a11');

    expect(await screen.findByRole('heading', { name: 'Time ran out while you were away' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/attempts/a11/ended');
    expect(screen.getByText(/You started World Geography .* It has a 4 min limit/)).toBeInTheDocument();
    expect(screen.getByText('2 of 5')).toBeInTheDocument();
    expect(screen.getByText('2/5 · 40%')).toBeInTheDocument();
    expect(screen.getByText('4:00')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See results' })).toHaveAttribute('href', '/attempts/a11/results');
  });

  it('closes the attempt when the quiz was updated and keeps the earlier best score', async () => {
    const { attemptId } = await quizService.startOrResumeAttempt('q1', 'u1');
    await quizService.updateQuiz('q1', { ...(await quizService.getQuizForEdit('q1')), timeLimitSeconds: 999 });

    renderRoute(`/attempts/${attemptId}`);

    expect(await screen.findByRole('heading', { name: 'This quiz was updated' })).toBeInTheDocument();
    expect(screen.getByText(/An admin changed JavaScript Basics after you started it/)).toBeInTheDocument();
    expect(screen.getByText(/Your earlier best score of 5 \/ 6 still stands/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start the new version' })).toHaveAttribute('href', '/quizzes/q1');
  });

  it('says the quiz is no longer available when it was deleted', async () => {
    const { attemptId } = await quizService.startOrResumeAttempt('q1', 'u1');
    await quizService.deleteQuiz('q1');

    renderRoute(`/attempts/${attemptId}`);

    expect(await screen.findByRole('heading', { name: 'This quiz is no longer available' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to quizzes' })).toHaveAttribute('href', '/quizzes');
    expect(screen.queryByRole('link', { name: 'Start the new version' })).not.toBeInTheDocument();
  });

  it('shows the results instead for an attempt that was submitted normally', async () => {
    const { router } = renderRoute('/attempts/a1/ended');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/attempts/a1/results');
    });
  });
});
