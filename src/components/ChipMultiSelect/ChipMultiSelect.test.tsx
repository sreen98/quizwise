import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { Flag } from '../Flag';
import { ChipMultiSelect } from '.';

const countries = [
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'GB', label: 'United Kingdom' }
];

const Countries = ({ initial = [] }: { initial?: string[] }) => {
  const [value, setValue] = useState(initial);
  return (
    <ChipMultiSelect
      label="Available in"
      placeholder="Search countries"
      nothingFoundMessage="No countries found"
      data={countries}
      value={value}
      onChange={setValue}
    />
  );
};

describe('ChipMultiSelect', () => {
  it('shows each picked option as a chip below the field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Countries />);

    await user.click(screen.getByRole('combobox', { name: 'Available in' }));
    await user.click(await screen.findByRole('option', { name: 'India' }));
    await user.click(await screen.findByRole('option', { name: 'United Kingdom' }));

    expect(screen.getByRole('button', { name: 'Remove India' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove United Kingdom' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Available in' })).toHaveValue('');
  });

  it('removes an option with its chip or by picking it again', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Countries initial={['IN', 'GB']} />);

    await user.click(screen.getByRole('button', { name: 'Remove India' }));
    expect(screen.queryByRole('button', { name: 'Remove India' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Available in' }));
    await user.click(await screen.findByRole('option', { name: 'United Kingdom' }));
    expect(screen.queryByRole('button', { name: 'Remove United Kingdom' })).not.toBeInTheDocument();
  });

  it('filters the options by what is typed and says when nothing matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Countries />);

    await user.type(screen.getByRole('combobox', { name: 'Available in' }), 'unit');
    expect(await screen.findByRole('option', { name: 'United Kingdom' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'India' })).not.toBeInTheDocument();

    await user.type(screen.getByRole('combobox', { name: 'Available in' }), 'zzz');
    expect(await screen.findByText('No countries found')).toBeInTheDocument();
  });

  it('shows the given icon next to each option and on each chip', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChipMultiSelect
        label="Available in"
        placeholder="Search countries"
        nothingFoundMessage="No countries found"
        data={countries}
        value={['GB']}
        onChange={() => {}}
        renderIcon={code => <Flag code={code} />}
      />
    );

    expect(screen.getByRole('button', { name: 'Remove United Kingdom' }).querySelector('.fi-gb')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Available in' }));
    expect((await screen.findByRole('option', { name: 'India' })).querySelector('.fi-in')).toBeInTheDocument();
  });

  it('picks an option with the keyboard', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Countries />);

    await user.click(screen.getByRole('combobox', { name: 'Available in' }));
    await user.keyboard('{ArrowDown}{Enter}');

    expect(await screen.findByRole('button', { name: 'Remove India' })).toBeInTheDocument();
  });
});
