import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { quizService } from '../../service/quizService';
import { useSessionStore } from '../../session/sessionStore';
import { renderRoute } from '../../test/renderWithProviders';

const asUser = (userId: string) => {
  useSessionStore.setState({ userId, countryFilter: null, slowNetwork: false });
};

const noAccess = () => screen.findByRole('heading', { name: "You don't have access to this page" });

describe('AdminOnly', () => {
  beforeEach(async () => {
    asUser('u1');
    await quizService.resetData();
  });

  it('blocks the admin list for a user who is not an admin', async () => {
    renderRoute('/admin');

    expect(await noAccess()).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Manage quizzes' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to quizzes' })).toHaveAttribute('href', '/quizzes');
  });

  it('opens the page after switching to the admin user', async () => {
    const user = userEvent.setup();
    renderRoute('/admin');

    await noAccess();
    await user.click(screen.getByRole('button', { name: 'Switch to Admin User' }));

    expect(await screen.findByRole('heading', { name: 'Manage quizzes' })).toBeInTheDocument();
    expect(useSessionStore.getState().userId).toBe('u5');
  });

  it('blocks a typed in editor URL for a user who is not an admin', async () => {
    renderRoute('/admin/quizzes/q1/edit');

    expect(await noAccess()).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /Title/ })).not.toBeInTheDocument();
  });

  it('opens the admin section for the admin user', async () => {
    asUser('u5');
    renderRoute('/admin');

    expect(await screen.findByRole('heading', { name: 'Manage quizzes' })).toBeInTheDocument();
  });

  it('shows the Admin tab only to the admin user', async () => {
    renderRoute('/quizzes');
    await screen.findAllByRole('link', { name: 'Leaderboard' });
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();

    asUser('u5');

    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: 'Admin' })).toHaveLength(2);
    });
  });

  it('blocks the page when the user switches away from the admin user', async () => {
    const user = userEvent.setup();
    asUser('u5');
    renderRoute('/admin');
    await screen.findByRole('heading', { name: 'Manage quizzes' });

    await user.click(screen.getByRole('combobox', { name: 'Viewing as' }));
    await user.click(await screen.findByRole('option', { name: 'Aarav Menon' }));

    expect(await noAccess()).toBeInTheDocument();
  });
});
