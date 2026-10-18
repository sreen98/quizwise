import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '../session/sessionStore';
import { renderRoute } from '../test/renderWithProviders';

describe('routes', () => {
  it('redirects the home page to the quiz list', async () => {
    const { router } = renderRoute('/');

    expect(await screen.findByRole('heading', { level: 1, name: 'Your quizzes' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/quizzes');
  });

  it('opens a deep link with its route params', async () => {
    useSessionStore.setState({ userId: 'u5', country: null, slowNetwork: false });
    renderRoute('/admin/quizzes/q2/edit');

    expect(await screen.findByRole('heading', { level: 1, name: 'Edit quiz' })).toBeInTheDocument();
  });

  it('shows page not found for an unknown URL', async () => {
    renderRoute('/no-such-page');

    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to quizzes' })).toHaveAttribute('href', '/quizzes');
  });

  it('marks the current section in the main navigation', async () => {
    renderRoute('/leaderboard/q1');

    const navs = await screen.findAllByRole('navigation', { name: 'Main' });
    expect(navs).toHaveLength(2);
    for (const nav of navs) {
      expect(within(nav).getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('aria-current', 'page');
      expect(within(nav).getByRole('link', { name: 'Quizzes' })).not.toHaveAttribute('aria-current');
    }
  });

  it('moves focus to the new page heading after following a link', async () => {
    const user = userEvent.setup();
    useSessionStore.setState({ userId: 'u1', country: null, slowNetwork: false });
    renderRoute('/quizzes');

    await screen.findByRole('heading', { level: 1, name: 'Your quizzes' });
    await user.click(within(screen.getByRole('banner')).getByRole('link', { name: 'Leaderboard' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Leaderboard' })).toHaveFocus();
    });
  });

  it('starts a new page at the top instead of keeping the scroll position', async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    useSessionStore.setState({ userId: 'u5', country: null, slowNetwork: false });
    renderRoute('/admin');

    await user.click(within(await screen.findByRole('table')).getByRole('link', { name: 'Edit General Science' }));

    await screen.findByRole('heading', { level: 1, name: 'Edit quiz' });
    expect(scrollTo).toHaveBeenLastCalledWith(0, 0);
    scrollTo.mockRestore();
  });

  it('keeps focus on a control inside the page when the path changes', async () => {
    const user = userEvent.setup();
    useSessionStore.setState({ userId: 'u1', country: null, slowNetwork: false });
    const { router } = renderRoute('/leaderboard/q1');

    const quizSelect = await screen.findByRole('combobox', { name: 'Quiz' });
    await user.click(quizSelect);
    await user.click(await screen.findByRole('option', { name: 'React Fundamentals' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/leaderboard/q2');
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Leaderboard' })).not.toHaveFocus();
  });
});
