import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { CountryFilter } from '.';

const countries = [
  { code: 'IN', name: 'India' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' }
];

const Filter = ({ initial }: { initial: string[] }) => {
  const [value, setValue] = useState(initial);
  return <CountryFilter countries={countries} value={value} onChange={setValue} />;
};

describe('CountryFilter', () => {
  it('picks several countries and keeps the list open', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Filter initial={['IN']} />);

    await user.click(screen.getByRole('button', { name: 'Country: India' }));
    await user.click(await screen.findByRole('option', { name: 'United Kingdom' }));

    expect(screen.getByRole('button', { name: 'Country: 2 countries' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'India' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'United Kingdom' })).toHaveAttribute('aria-selected', 'true');
  });

  it('clears the countries with All countries', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Filter initial={['IN', 'GB']} />);

    await user.click(screen.getByRole('button', { name: 'Country: 2 countries' }));
    await user.click(await screen.findByRole('option', { name: 'All countries' }));

    expect(screen.getByRole('button', { name: 'Country: All countries' })).toBeInTheDocument();
  });

  it('searches the countries and shows their flags', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Filter initial={[]} />);

    await user.click(screen.getByRole('button', { name: 'Country: All countries' }));
    await user.type(await screen.findByRole('textbox', { name: 'Search countries' }), 'arab');

    const option = await screen.findByRole('option', { name: 'United Arab Emirates' });
    expect(option.querySelector('.fi-ae')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'India' })).not.toBeInTheDocument();
  });

  it('shows the flags of the chosen countries on the field', () => {
    renderWithProviders(<Filter initial={['GB']} />);

    expect(screen.getByRole('button', { name: 'Country: United Kingdom' }).querySelector('.fi-gb')).toBeInTheDocument();
  });
});
