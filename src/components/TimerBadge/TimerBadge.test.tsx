import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { TimerBadge } from '.';

describe('TimerBadge', () => {
  it('shows the time left and the quiz limit', () => {
    renderWithProviders(<TimerBadge scope="quiz" remainingMs={222_000} limitSeconds={300} showShortLabel={false} />);

    expect(screen.getByRole('timer')).toHaveTextContent('3:42left of 5:00');
  });

  it('rounds part of a second up so the timer reaches 0:00 only when time is up', () => {
    renderWithProviders(<TimerBadge scope="question" remainingMs={29_100} limitSeconds={30} showShortLabel={false} />);

    expect(screen.getByRole('timer')).toHaveTextContent('0:30left on this question');
  });

  it('turns to the warning state in the last 30 seconds of a longer limit', () => {
    const { rerender } = renderWithProviders(
      <TimerBadge scope="quiz" remainingMs={31_000} limitSeconds={300} showShortLabel={false} />
    );
    expect(screen.getByRole('timer')).not.toHaveAttribute('data-warning');

    rerender(<TimerBadge scope="quiz" remainingMs={30_000} limitSeconds={300} showShortLabel={false} />);

    expect(screen.getByRole('timer')).toHaveAttribute('data-warning');
  });

  it('waits until 10 seconds are left when the limit is only 30 seconds', () => {
    const { rerender } = renderWithProviders(
      <TimerBadge scope="question" remainingMs={25_000} limitSeconds={30} showShortLabel={false} />
    );
    expect(screen.getByRole('timer')).not.toHaveAttribute('data-warning');

    rerender(<TimerBadge scope="question" remainingMs={10_000} limitSeconds={30} showShortLabel={false} />);

    expect(screen.getByRole('timer')).toHaveAttribute('data-warning');
  });
});
