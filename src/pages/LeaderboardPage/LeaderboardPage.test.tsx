import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { quizService } from '../../service/quizService';
import { useSessionStore } from '../../session/sessionStore';
import { renderRoute } from '../../test/renderWithProviders';

const asUser = (userId: string) => {
  useSessionStore.setState({ userId, country: null, slowNetwork: false });
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

  it('opens the first quiz when no quiz is chosen', async () => {
    const { router } = renderRoute('/leaderboard');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/leaderboard/q1');
    });
  });

  it('shows the top three on a podium in rank order for screen readers', async () => {
    renderRoute('/leaderboard/q1');

    const top = await podium();

    expect(top).toHaveLength(3);
    expect(top[0]).toHaveTextContent('1st');
    expect(top[0]).toHaveTextContent('Fatima Al Mansoori');
    expect(top[0]).toHaveTextContent('6/6 / 100%');
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
    expect(screen.getByText('Showing 4 of 4')).toBeInTheDocument();
  });

  it('shows the current user rank, how to move up and a retake button', async () => {
    renderRoute('/leaderboard/q1');
    await podium();

    expect(standing()).toHaveTextContent('Your rank: #3 of 4');
    expect(standing()).toHaveTextContent('Top 75%');
    expect(standing()).toHaveTextContent("You're level with Diya Nair on score. Finish 23 s faster to move up.");
    expect(standing()).toHaveTextContent('Current standing5/6');
    expect(within(standing()).getByRole('link', { name: 'Retake quiz' })).toHaveAttribute('href', '/quizzes/q1');
  });

  it('searches the standings by player or country', async () => {
    const user = userEvent.setup();
    renderRoute('/leaderboard/q1');
    await podium();

    await user.type(screen.getByRole('textbox', { name: 'Search players' }), 'india');

    expectStandings(['Diya Nair', 'Aarav Menon']);
    expect(screen.getByText('Showing 2 of 4')).toBeInTheDocument();

    await user.clear(screen.getByRole('textbox', { name: 'Search players' }));
    await user.type(screen.getByRole('textbox', { name: 'Search players' }), 'nobody');

    expect(screen.getByText('No players match "nobody".')).toBeInTheDocument();
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
    expect(standing()).toHaveTextContent('Your rank: #4 of 4');
    expect(standing()).toHaveTextContent('3 players ahead of you.');
  });

  it('switches to another quiz by searching for it', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/leaderboard/q1');
    await podium();

    const quizSelect = screen.getByRole('combobox', { name: 'Quiz' });
    await user.clear(quizSelect);
    await user.type(quizSelect, 'geo');
    await user.click(await screen.findByRole('option', { name: 'World Geography' }));

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

    expect(await screen.findByText('Quiz not found')).toBeInTheDocument();
  });
});
