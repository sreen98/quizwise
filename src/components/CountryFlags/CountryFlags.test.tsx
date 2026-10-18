import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { CountryFlags } from '.';

const countries = [
  { code: 'IN', name: 'India' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' }
];

describe('CountryFlags', () => {
  it('names every country for screen readers and in a tooltip', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CountryFlags codes={['IN', 'GB']} countries={countries} />);

    const flags = screen.getByRole('img', { name: 'Available in India, United Kingdom' });
    await user.hover(flags);

    expect(await screen.findByRole('tooltip')).toHaveTextContent('India, United Kingdom');
  });

  it('shows three flags and a count for the rest', () => {
    renderWithProviders(<CountryFlags codes={['IN', 'AE', 'GB', 'FR']} countries={countries} />);

    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Available in India, United Arab Emirates, United Kingdom, France' })
    ).toBeInTheDocument();
  });
});
