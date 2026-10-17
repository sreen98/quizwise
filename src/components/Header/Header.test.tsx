import { screen, waitFor, within } from '@testing-library/react';
import { notifications } from '@mantine/notifications';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { quizService } from '../../service/quizService';
import { DEFAULT_USER_ID, useSessionStore } from '../../session/sessionStore';
import { simulatedDelay } from '../../service/latency';
import { renderRoute } from '../../test/renderWithProviders';

const userSelect = () => screen.getByRole('combobox', { name: 'Viewing as' });

const openResetDialog = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Settings' }));
  await user.click(await screen.findByRole('button', { name: 'Reset data' }));
};

const chooseUser = async (label: string) => {
  const user = userEvent.setup();
  await user.click(userSelect());
  await user.click(await screen.findByRole('option', { name: label }));
};

describe('Header user controls', () => {
  beforeEach(async () => {
    notifications.clean();
    useSessionStore.setState({ userId: DEFAULT_USER_ID, country: null, slowNetwork: false });
    await quizService.resetData();
  });

  it('lists every user and starts as Aarav Menon', async () => {
    const user = userEvent.setup();
    renderRoute('/quizzes');

    await waitFor(() => {
      expect(userSelect()).toHaveValue('Aarav Menon');
    });
    await user.click(userSelect());

    expect(await screen.findAllByRole('option')).toHaveLength(5);
  });

  it('switches the user and remembers the choice', async () => {
    renderRoute('/quizzes');
    await waitFor(() => {
      expect(userSelect()).toHaveValue('Aarav Menon');
    });

    await chooseUser('Fatima Al Mansoori');

    expect(useSessionStore.getState().userId).toBe('u2');
    expect(localStorage.getItem('quizwise:session')).toContain('"userId":"u2"');
  });

  it('leaves a results page when the user changes', async () => {
    const { router } = renderRoute('/attempts/a1/results');
    await waitFor(() => {
      expect(userSelect()).toHaveValue('Aarav Menon');
    });

    await chooseUser('Diya Nair');

    expect(router.state.location.pathname).toBe('/quizzes');
  });

  it('leaves a results page and clears the country filter after a reset', async () => {
    const user = userEvent.setup();
    useSessionStore.setState({ country: 'GB' });
    const { router } = renderRoute('/attempts/a1/results');

    await openResetDialog();
    const dialog = await screen.findByRole('dialog', { name: 'Reset all data?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reset data' }));

    expect(router.state.location.pathname).toBe('/quizzes');
    expect(useSessionStore.getState().country).toBeNull();
  });

  it('switches back to the default user when the saved user no longer exists', async () => {
    useSessionStore.setState({ userId: 'u99' });
    renderRoute('/quizzes');

    await waitFor(() => {
      expect(userSelect()).toHaveValue('Aarav Menon');
    });
    expect(useSessionStore.getState().userId).toBe(DEFAULT_USER_ID);
  });

  it('restores the seed after confirming a reset', async () => {
    const user = userEvent.setup();
    await quizService.deleteQuiz('q1');
    renderRoute('/quizzes');

    await openResetDialog();
    const dialog = await screen.findByRole('dialog', { name: 'Reset all data?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reset data' }));

    expect(await screen.findByText('Data reset')).toBeInTheDocument();
    await expect(quizService.getQuiz('q1')).resolves.toMatchObject({ id: 'q1' });
  });

  it('closes the settings before showing the reset dialog', async () => {
    renderRoute('/quizzes');

    await openResetDialog();

    expect(await screen.findByRole('dialog', { name: 'Reset all data?' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('switch', { name: /Simulate slow network/ })).not.toBeInTheDocument();
    });
  });

  it('changes nothing when the reset is cancelled', async () => {
    const user = userEvent.setup();
    await quizService.deleteQuiz('q1');
    renderRoute('/quizzes');

    await openResetDialog();
    const dialog = await screen.findByRole('dialog', { name: 'Reset all data?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await expect(quizService.getQuiz('q1')).rejects.toThrow('Quiz not found');
  });

  it('turns the simulated slow network off from the settings and remembers it', async () => {
    const user = userEvent.setup();
    useSessionStore.setState({ slowNetwork: true });
    renderRoute('/quizzes');

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const slowNetwork = await screen.findByRole('switch', { name: /Simulate slow network/ });
    expect(slowNetwork).toBeChecked();
    await user.click(slowNetwork);

    expect(slowNetwork).not.toBeChecked();
    expect(simulatedDelay()).toBe(0);
    expect(localStorage.getItem('quizwise:session')).toContain('"slowNetwork":false');
  });
});
