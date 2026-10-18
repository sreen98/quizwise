import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ColorSchemeToggle } from '.';

const scheme = () => document.documentElement.getAttribute('data-mantine-color-scheme');

describe('ColorSchemeToggle', () => {
  beforeEach(() => {
    localStorage.removeItem('mantine-color-scheme-value');
  });

  it('starts in light mode', () => {
    renderWithProviders(<ColorSchemeToggle />);

    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
    expect(scheme()).toBe('light');
  });

  it('switches between dark and light mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ColorSchemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(scheme()).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(scheme()).toBe('light');
  });

  it('remembers the choice the next time the app opens', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<ColorSchemeToggle />);
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    unmount();

    renderWithProviders(<ColorSchemeToggle />);

    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
    expect(scheme()).toBe('dark');
  });
});
