import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { OptionList } from '.';

const options = [
  { id: 'a', text: 'string' },
  { id: 'b', text: 'object' },
  { id: 'c', text: 'boolean' }
];

describe('OptionList', () => {
  it('shows single choice options as radio buttons with the selected one checked', () => {
    renderWithProviders(<OptionList type="single" options={options} value={['b']} onChange={vi.fn()} />);

    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'object' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'string' })).not.toBeChecked();
  });

  it('replaces the selection when another single choice option is picked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<OptionList type="single" options={options} value={['b']} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'boolean' }));

    expect(onChange).toHaveBeenCalledWith(['c']);
  });

  it('shows multiple choice options as checkboxes with every selected one checked', () => {
    renderWithProviders(<OptionList type="multiple" options={options} value={['a', 'c']} onChange={vi.fn()} />);

    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.getByRole('checkbox', { name: 'string' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'object' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'boolean' })).toBeChecked();
  });

  it('adds an option to the multiple choice selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<OptionList type="multiple" options={options} value={['a']} onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'object' }));

    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('removes an option from the multiple choice selection when it is picked again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<OptionList type="multiple" options={options} value={['a', 'c']} onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'string' }));

    expect(onChange).toHaveBeenCalledWith(['c']);
  });

  it('selects with the keyboard using Space', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<OptionList type="multiple" options={options} value={[]} onChange={onChange} />);

    await user.tab();
    await user.keyboard(' ');

    expect(onChange).toHaveBeenCalledWith(['a']);
  });
});
