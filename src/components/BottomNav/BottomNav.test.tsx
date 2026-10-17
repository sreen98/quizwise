import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { quizService } from '../../service/quizService';
import { DEFAULT_USER_ID, useSessionStore } from '../../session/sessionStore';
import { renderRoute } from '../../test/renderWithProviders';

const accountTab = () => screen.getByRole('button', { name: 'Account' });

describe('BottomNav', () => {
  beforeEach(async () => {
    useSessionStore.setState({ userId: DEFAULT_USER_ID, country: null, slowNetwork: false });
    await quizService.resetData();
  });

  it('opens the account sheet with the user switcher and settings', async () => {
    const user = userEvent.setup();
    renderRoute('/quizzes');

    await user.click(accountTab());

    const sheet = await screen.findByRole('dialog', { name: 'Account' });
    expect(accountTab()).toHaveAttribute('aria-expanded', 'true');
    expect(within(sheet).getByRole('combobox', { name: 'Viewing as' })).toBeInTheDocument();
    expect(within(sheet).getByRole('switch', { name: /Simulate slow network/ })).toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: 'Reset data' })).toBeInTheDocument();
  });

  it('closes the sheet after switching the user', async () => {
    const user = userEvent.setup();
    renderRoute('/quizzes');

    await user.click(accountTab());
    const sheet = await screen.findByRole('dialog', { name: 'Account' });
    const select = within(sheet).getByRole('combobox', { name: 'Viewing as' });
    await waitFor(() => {
      expect(select).toBeEnabled();
    });
    await user.click(select);
    await user.click(await screen.findByRole('option', { name: 'Diya Nair' }));

    expect(useSessionStore.getState().userId).toBe('u4');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Account' })).not.toBeInTheDocument();
    });
  });
});
