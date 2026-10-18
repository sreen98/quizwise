import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { quizService } from '../../service/quizService';
import { DEFAULT_USER_ID, useSessionStore } from '../../session/sessionStore';
import { renderRoute } from '../../test/renderWithProviders';

const accountTab = () => screen.getByRole('button', { name: 'Account' });

describe('BottomNav', () => {
  beforeEach(async () => {
    useSessionStore.setState({ userId: DEFAULT_USER_ID, countryFilter: null, slowNetwork: false });
    await quizService.resetData();
  });

  it('opens the account sheet with the user list and settings', async () => {
    const user = userEvent.setup();
    renderRoute('/quizzes');

    await user.click(accountTab());

    const sheet = await screen.findByRole('dialog', { name: 'Account' });
    expect(accountTab()).toHaveAttribute('aria-expanded', 'true');
    expect(await within(sheet).findByRole('button', { name: 'Aarav Menon' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(sheet).getByRole('button', { name: 'Diya Nair' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(sheet).getByRole('switch', { name: /Simulate slow network/ })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'Reset data' })).toBeInTheDocument();
  });

  it('closes the sheet after switching the user', async () => {
    const user = userEvent.setup();
    renderRoute('/quizzes');

    await user.click(accountTab());
    const sheet = await screen.findByRole('dialog', { name: 'Account' });
    await user.click(await within(sheet).findByRole('button', { name: 'Diya Nair' }));

    expect(useSessionStore.getState().userId).toBe('u4');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Account' })).not.toBeInTheDocument();
    });
  });

  it('filters the user list by name', async () => {
    const user = userEvent.setup();
    renderRoute('/quizzes');

    await user.click(accountTab());
    const sheet = await screen.findByRole('dialog', { name: 'Account' });
    await within(sheet).findByRole('button', { name: 'Diya Nair' });
    await user.type(within(sheet).getByRole('textbox', { name: 'Search users' }), 'fat');

    await waitFor(() => {
      expect(within(sheet).queryByRole('button', { name: 'Diya Nair' })).not.toBeInTheDocument();
    });
    expect(within(sheet).getByRole('button', { name: 'Fatima Al Mansoori' })).toBeInTheDocument();

    await user.clear(within(sheet).getByRole('textbox', { name: 'Search users' }));
    await user.type(within(sheet).getByRole('textbox', { name: 'Search users' }), 'zzz');
    expect(await within(sheet).findByText('No users match "zzz".')).toBeInTheDocument();
  });
});
