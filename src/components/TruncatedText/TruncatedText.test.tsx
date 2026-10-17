import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { TruncatedText } from '.';

const setWidths = (scrollWidth: number, clientWidth: number) => {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth);
};

describe('TruncatedText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the full text on hover when the text is cut off', async () => {
    const user = userEvent.setup();
    setWidths(400, 200);
    renderWithProviders(<TruncatedText>A long description that does not fit</TruncatedText>);

    await user.hover(screen.getByText('A long description that does not fit'));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('A long description that does not fit');
  });

  it('shows no tooltip when the text fits', async () => {
    const user = userEvent.setup();
    setWidths(120, 200);
    renderWithProviders(<TruncatedText>Short text</TruncatedText>);

    await user.hover(screen.getByText('Short text'));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
