import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import { SearchableSelect } from '.';

const quizzes = [
  { value: 'q1', label: 'JavaScript Basics' },
  { value: 'q2', label: 'React Fundamentals' },
  { value: 'q3', label: 'World Geography' }
];

const QuizSelect = () => {
  const [value, setValue] = useState<string | null>('q1');
  return (
    <SearchableSelect
      label="Quiz"
      searchLabel="Search quizzes"
      nothingFoundMessage="No quizzes found"
      data={quizzes}
      value={value}
      onChange={setValue}
    />
  );
};

describe('SearchableSelect', () => {
  it('opens with the search box focused and the current option ticked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizSelect />);

    await user.click(screen.getByRole('button', { name: 'Quiz: JavaScript Basics' }));

    expect(await screen.findByRole('textbox', { name: 'Search quizzes' })).toHaveFocus();
    expect(screen.getByRole('option', { name: 'JavaScript Basics' })).toHaveAttribute('aria-selected', 'true');
  });

  it('filters by what is typed and picks an option', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizSelect />);

    await user.click(screen.getByRole('button', { name: 'Quiz: JavaScript Basics' }));
    await user.type(await screen.findByRole('textbox', { name: 'Search quizzes' }), 'react');
    expect(screen.queryByRole('option', { name: 'World Geography' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'React Fundamentals' }));

    expect(screen.getByRole('button', { name: 'Quiz: React Fundamentals' })).toBeInTheDocument();
  });

  it('picks an option with the keyboard and says when nothing matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizSelect />);

    await user.click(screen.getByRole('button', { name: 'Quiz: JavaScript Basics' }));
    await user.keyboard('world{ArrowDown}{Enter}');
    expect(screen.getByRole('button', { name: 'Quiz: World Geography' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Quiz: World Geography' }));
    await user.keyboard('zzz');
    expect(await screen.findByText('No quizzes found')).toBeInTheDocument();
  });
});
