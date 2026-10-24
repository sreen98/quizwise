import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { quizService } from '../../service/quizService';
import { useSessionStore } from '../../session/sessionStore';
import { renderRoute } from '../../test/renderWithProviders';

const asUser = (userId: string) => {
  useSessionStore.setState({ userId, countryFilter: null, slowNetwork: false });
};

const podium = async () => within(await screen.findByRole('list', { name: 'Top players' })).getAllByRole('listitem');

const tableRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

const expectStandings = (names: string[]) => {
  const rows = tableRows();
  expect(rows).toHaveLength(names.length);
  names.forEach((name, index) => {
    expect(rows[index]).toHaveTextContent(name);
  });
};

const standing = () => screen.getByRole('region', { name: 'Your standing' });

describe('LeaderboardPage', () => {
  beforeEach(async () => {
    asUser('u1');
    await quizService.resetData();
  });

  it('opens the first quiz when no quiz is chosen without loading it twice', async () => {
    const { router } = renderRoute('/leaderboard');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/leaderboard/q1');
    });
    expect(screen.getByRole('list', { name: 'Top players' })).toBeInTheDocument();
  });

  it('ranks players across all quizzes by total score, then total time', async () => {
    renderRoute('/leaderboard/all');

    const mine = await screen.findByRole('region', { name: 'Your global standing' });

    expect(mine).toHaveTextContent('#3 of 4');
    expect(mine).toHaveTextContent(/Total score\s*11/);
    expect(mine).toHaveTextContent(/Quizzes\s*2/);
    expect(mine).toHaveTextContent(/Total time\s*5:16/);
    expectStandings(['Fatima Al Mansoori', 'Oliver Smith', 'Aarav Menon', 'Diya Nair']);
    expect(tableRows()[2]).toHaveAttribute('aria-current', 'true');
  });

  it('shows the global rank of a player outside the top list', async () => {
    asUser('u4');
    renderRoute('/leaderboard/all?top=3');

    const mine = await screen.findByRole('region', { name: 'Your global standing' });

    expect(mine).toHaveTextContent('#4 of 4');
    expectStandings(['Fatima Al Mansoori', 'Oliver Smith', 'Aarav Menon']);
  });

  it('updates the global rank after a quiz is completed', async () => {
    asUser('u5');
    renderRoute('/leaderboard/all');
    expect(await screen.findByText('Not ranked yet')).toBeInTheDocument();

    const { attemptId } = await quizService.startOrResumeAttempt('q2', 'u5');
    await quizService.completeAttempt(attemptId);

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Your global standing' })).toHaveTextContent('#5 of 5');
    });
  });

  it('shows the top three on a podium in rank order for screen readers', async () => {
    renderRoute('/leaderboard/q1');

    const top = await podium();

    expect(top).toHaveLength(3);
    expect(top[0]).toHaveTextContent('1st');
    expect(top[0]).toHaveTextContent('Fatima Al Mansoori');
    expect(top[0]).toHaveTextContent('6/6 correct');
    expect(top[0]).toHaveTextContent(/Accuracy.*100%/);
    expect(top[1]).toHaveTextContent('Diya Nair');
    expect(top[2]).toHaveTextContent('Aarav Menon');
    expect(top[2]).toHaveTextContent('You');
    expect(top[2]).toHaveAttribute('aria-current', 'true');
  });

  it('lists every player in the standings ranked by score, then time', async () => {
    renderRoute('/leaderboard/q1');
    await podium();

    expectStandings(['Fatima Al Mansoori', 'Diya Nair', 'Aarav Menon', 'Oliver Smith']);
    expect(tableRows()[2]).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('Showing 4 players')).toBeInTheDocument();
  });

  it('shows the current user rank, how to move up and a retake button', async () => {
    renderRoute('/leaderboard/q1');
    await podium();

    expect(standing()).toHaveTextContent(/Your rank.*#3 of 4/);
    expect(standing()).toHaveTextContent('Top 75%');
    expect(standing()).toHaveTextContent("You're level with Diya Nair on score. Finish 23 s faster to move up.");
    expect(standing()).toHaveTextContent(/Score.*5\/6 83.3%/);
    expect(standing()).toHaveTextContent(/Time.*per question/);
    expect(standing()).toHaveTextContent('Keeps your best score');
    expect(within(standing()).getByRole('link', { name: 'Retake quiz' })).toHaveAttribute('href', '/quizzes/q1');
  });

  it('searches the standings by player or country', async () => {
    const user = userEvent.setup();
    renderRoute('/leaderboard/q1');
    await podium();

    await user.type(screen.getByRole('textbox', { name: 'Search players' }), 'india');

    expect(await screen.findByText('Showing 2 players')).toBeInTheDocument();
    expectStandings(['Diya Nair', 'Aarav Menon']);

    await user.clear(screen.getByRole('textbox', { name: 'Search players' }));
    await user.type(screen.getByRole('textbox', { name: 'Search players' }), 'nobody');

    expect(await screen.findByText('No players match "nobody".')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByRole('textbox', { name: 'Search players' })).toHaveValue('');
    expect(await screen.findByText('Showing 4 players')).toBeInTheDocument();
  });

  it('limits the list to the top players and still shows the rank of a user below them', async () => {
    const user = userEvent.setup();
    asUser('u3');
    const { router } = renderRoute('/leaderboard/q1');
    await podium();

    await user.click(screen.getByRole('combobox', { name: 'Show' }));
    await user.click(await screen.findByRole('option', { name: 'Top 3' }));

    await waitFor(() => {
      expect(router.state.location.search).toBe('?top=3');
    });
    await waitFor(() => {
      expect(tableRows()).toHaveLength(3);
    });
    expect(standing()).toHaveTextContent(/Your rank.*#4 of 4/);
    expect(standing()).toHaveTextContent('3 players ahead of you.');
  });

  it('switches to another quiz by searching for it', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/leaderboard/q1');
    await podium();

    await user.click(screen.getByRole('button', { name: 'Quiz: JavaScript Basics' }));
    await user.type(await screen.findByRole('textbox', { name: 'Search quizzes' }), 'geo');
    expect(screen.queryByRole('option', { name: 'React Fundamentals' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'World Geography' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/leaderboard/q3');
    });
    await waitFor(async () => {
      expect(await podium()).toHaveLength(2);
    });
  });

  it('invites a user who has not finished the quiz to start it', async () => {
    asUser('u5');
    renderRoute('/leaderboard/q1');
    await podium();

    expect(standing()).toHaveTextContent("You haven't completed this quiz yet.");
    expect(within(standing()).getByRole('link', { name: 'Start quiz' })).toHaveAttribute('href', '/quizzes/q1');
  });

  it('says when a quiz does not exist', async () => {
    renderRoute('/leaderboard/q99');

    expect(await screen.findByRole('heading', { level: 1, name: 'Quiz not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Show another leaderboard' })).toHaveAttribute('href', '/leaderboard');
  });

  it('shows every player with All and pages the standings ten at a time', async () => {
    const user = userEvent.setup();
    await quizService.loadTestData();
    const ranked = (await quizService.getLeaderboard('q1', Number.POSITIVE_INFINITY, 'u1')).rankedCount;
    const { router } = renderRoute('/leaderboard/q1?top=all');

    expect(await screen.findByText(`Showing 1 to 10 of ${String(ranked)} players`)).toBeInTheDocument();
    expect(tableRows()).toHaveLength(10);
    await user.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(await screen.findByText(`Showing 11 to 20 of ${String(ranked)} players`)).toBeInTheDocument();
    expect(router.state.location.search).toBe('?top=all&page=2');
  });
});
