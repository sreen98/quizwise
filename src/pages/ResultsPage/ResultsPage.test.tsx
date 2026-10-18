import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { quizService } from '../../service/quizService';
import { useSessionStore } from '../../session/sessionStore';
import { renderRoute } from '../../test/renderWithProviders';

describe('ResultsPage', () => {
  beforeEach(async () => {
    useSessionStore.setState({ userId: 'u1', country: null, slowNetwork: false });
    await quizService.resetData();
  });

  it('shows the score, counts, time and rank', async () => {
    renderRoute('/attempts/a1/results');

    expect(await screen.findByRole('heading', { level: 1, name: 'JavaScript Basics' })).toBeInTheDocument();
    expect(screen.getByText('Nice work, Aarav. You scored 5 out of 6.')).toBeInTheDocument();
    expect(screen.getByText('83.3%')).toBeInTheDocument();
    expect(screen.getByText('2:22')).toBeInTheDocument();
    expect(screen.getByText('of 4')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All quizzes' })).toHaveAttribute('href', '/quizzes');
  });

  it('offers the leaderboard and a retake as next steps', async () => {
    renderRoute('/attempts/a1/results');

    expect(await screen.findByRole('link', { name: /See where you stand\s*Best rank #3 of 4/ })).toHaveAttribute(
      'href',
      '/leaderboard/q1'
    );
    expect(screen.getByRole('link', { name: /Try again\s*Beat your best score of 5\/6/ })).toHaveAttribute(
      'href',
      '/quizzes/q1'
    );
  });

  it('lists every question as correct or incorrect', async () => {
    renderRoute('/attempts/a1/results');

    const breakdown = await screen.findByRole('list');
    const rows = within(breakdown).getAllByRole('listitem');

    expect(rows).toHaveLength(6);
    expect(rows[4]).toHaveTextContent('Which array methods return a new array?Incorrect');
    expect(within(breakdown).getAllByText('Correct')).toHaveLength(5);
  });

  it('marks a quiz that allows one attempt as already completed', async () => {
    renderRoute('/attempts/a5/results');

    expect(await screen.findByText('Already completed')).toBeInTheDocument();
    expect(screen.getByText('This quiz allows one attempt, so this is your final result.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Try again/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /See where you stand/ })).toHaveAttribute('href', '/leaderboard/q2');
  });

  it('hides the breakdown when the quiz has changed since the attempt', async () => {
    await quizService.updateQuiz('q1', { ...(await quizService.getQuizForEdit('q1')), description: 'Revised' });
    renderRoute('/attempts/a1/results');

    expect(
      await screen.findByText("This quiz has changed since your attempt, so the question breakdown isn't shown.")
    ).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('sends an attempt that is still in progress back to its question', async () => {
    const { attemptId } = await quizService.startOrResumeAttempt('q1', 'u1');
    const { router } = renderRoute(`/attempts/${attemptId}/results`);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/attempts/${attemptId}`);
    });
  });

  it("does not show another user's result", async () => {
    useSessionStore.setState({ userId: 'u2' });
    renderRoute('/attempts/a1/results');

    expect(await screen.findByRole('heading', { name: 'Result not found' })).toBeInTheDocument();
    expect(screen.queryByText(/You scored/)).not.toBeInTheDocument();
  });

  it('says when a result does not exist', async () => {
    renderRoute('/attempts/a99/results');

    expect(await screen.findByRole('heading', { name: 'Result not found' })).toBeInTheDocument();
  });
});
