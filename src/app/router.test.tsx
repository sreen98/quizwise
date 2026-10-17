import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '../test/renderWithProviders';

describe('routes', () => {
  it('redirects the home page to the quiz list', async () => {
    const { router } = renderRoute('/');

    expect(await screen.findByRole('heading', { level: 1, name: 'Your quizzes' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/quizzes');
  });

  it('opens a deep link with its route params', async () => {
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
});
