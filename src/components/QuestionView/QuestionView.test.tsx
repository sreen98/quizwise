import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { QuestionType } from '../../types/models';
import { QuestionView } from '.';

const question = (type: QuestionType) => ({
  id: 'q1',
  text: 'Which of these are planets?',
  type,
  options: [
    { id: 'a', text: 'Mars' },
    { id: 'b', text: 'Moon' }
  ]
});

describe('QuestionView', () => {
  it('tells the player to select every answer on a multiple choice question', () => {
    renderWithProviders(
      <QuestionView question={question('multiple')} value={[]} onChange={() => {}} disabled={false} />
    );

    expect(screen.getByText('Multiple choice · Select all that apply')).toBeInTheDocument();
  });

  it('shows no type label on a single choice question', () => {
    renderWithProviders(<QuestionView question={question('single')} value={[]} onChange={() => {}} disabled={false} />);

    expect(screen.queryByText(/Single choice/)).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Mars' })).toBeInTheDocument();
  });
});
