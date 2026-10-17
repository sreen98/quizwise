import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { quizService } from '../../service/quizService';
import { DEFAULT_USER_ID, useSessionStore } from '../../session/sessionStore';
import { renderRoute } from '../../test/renderWithProviders';

const card = async (title: string) => {
  const heading = await screen.findByRole('heading', { level: 2, name: title });
  const article = heading.closest('article');
  if (!article) throw new Error(`No card for ${title}`);
  return within(article);
};

const cardTitles = () => screen.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent);

const chooseCountry = async (name: string) => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('combobox', { name: 'Country' }));
  await user.click(await screen.findByRole('option', { name }));
};

describe('QuizListPage', () => {
  beforeEach(async () => {
    useSessionStore.setState({ userId: DEFAULT_USER_ID, country: null, slowNetwork: false });
    await quizService.resetData();
  });

  it('announces loading and then shows the quizzes for the user country', async () => {
    renderRoute('/quizzes');

    expect(screen.getByRole('status')).toHaveTextContent('Loading quizzes');
    expect(await screen.findByText('4 quizzes available in India · 2 completed · 1 in progress')).toBeInTheDocument();
    expect(cardTitles()).toEqual([
      'JavaScript Basics',
      'React Fundamentals',
      'World Geography',
      'Kerala Culture and History'
    ]);
  });

  it('offers to resume a quiz that is in progress', async () => {
    renderRoute('/quizzes');
    const geography = await card('World Geography');

    expect(geography.getByText('In progress · 2 of 5 answered')).toBeInTheDocument();
    expect(geography.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', '/attempts/a11');
  });

  it('shows the best score and rank of a completed quiz that allows retakes', async () => {
    renderRoute('/quizzes');
    const javascript = await card('JavaScript Basics');

    expect(javascript.getByText('Completed · 83%')).toBeInTheDocument();
    expect(javascript.getByText('Best score')).toBeInTheDocument();
    expect(javascript.getByText('5 / 6')).toBeInTheDocument();
    expect(javascript.getByRole('link', { name: 'Rank #3 of 4' })).toHaveAttribute('href', '/leaderboard/q1');
    expect(javascript.getByRole('link', { name: 'Retake' })).toHaveAttribute('href', '/quizzes/q1');
  });

  it('links to the previous result when retakes are not allowed', async () => {
    renderRoute('/quizzes');
    const react = await card('React Fundamentals');

    expect(react.getByText('One attempt')).toBeInTheDocument();
    expect(react.getByText('30 s')).toBeInTheDocument();
    expect(react.getByText('for each question')).toBeInTheDocument();
    expect(react.getByRole('link', { name: 'View result' })).toHaveAttribute('href', '/attempts/a5/results');
  });

  it('offers to start a quiz that is not started', async () => {
    renderRoute('/quizzes');
    const kerala = await card('Kerala Culture and History');

    expect(kerala.getByText('Not started')).toBeInTheDocument();
    expect(kerala.getByText('India only')).toBeInTheDocument();
    expect(kerala.getByRole('link', { name: 'Start' })).toHaveAttribute('href', '/quizzes/q4');
  });

  it('filters by another country and remembers it', async () => {
    renderRoute('/quizzes');
    await card('JavaScript Basics');

    await chooseCountry('United Kingdom');

    await waitFor(() => {
      expect(cardTitles()).toEqual(['JavaScript Basics', 'React Fundamentals', 'World Geography', 'General Science']);
    });
    expect(useSessionStore.getState().country).toBe('GB');
  });

  it('shows an empty state and can switch to all countries', async () => {
    const user = userEvent.setup();
    for (const quizId of ['q1', 'q2', 'q3', 'q5']) await quizService.deleteQuiz(quizId);
    useSessionStore.setState({ country: 'GB' });
    renderRoute('/quizzes');

    expect(await screen.findByRole('heading', { name: 'No quizzes here yet' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show all countries' }));

    expect(await card('Kerala Culture and History')).toBeTruthy();
  });

  it('updates when the data changes', async () => {
    renderRoute('/quizzes');
    await card('Kerala Culture and History');

    await quizService.deleteQuiz('q4');

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 2, name: 'Kerala Culture and History' })).not.toBeInTheDocument();
    });
  });
});
