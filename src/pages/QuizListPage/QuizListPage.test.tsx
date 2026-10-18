import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const choose = async (label: string, name: string) => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name }));
};

const chooseCountry = (name: string) => choose('Country', name);

describe('QuizListPage', () => {
  beforeEach(async () => {
    useSessionStore.setState({ userId: DEFAULT_USER_ID, country: null, slowNetwork: false });
    await quizService.resetData();
  });

  it('announces loading and then shows the quizzes for the user country', async () => {
    renderRoute('/quizzes');

    expect(screen.getByRole('status')).toHaveTextContent('Loading quizzes');
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('India');
    });
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('All (4)');
    expect(cardTitles()).toEqual([
      'JavaScript Basics',
      'React Fundamentals',
      'World Geography',
      'Kerala Culture and History'
    ]);
  });

  it('counts the quizzes by status and shows only the chosen ones', async () => {
    const user = userEvent.setup();
    renderRoute('/quizzes');
    await card('JavaScript Basics');

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    expect((await screen.findAllByRole('option')).map(option => option.textContent)).toEqual([
      'All (4)',
      'Not started (1)',
      'In progress (1)',
      'Completed (2)'
    ]);
    await user.click(screen.getByRole('option', { name: 'Completed (2)' }));
    expect(cardTitles()).toEqual(['JavaScript Basics', 'React Fundamentals']);

    await choose('Status', 'In progress (1)');
    expect(cardTitles()).toEqual(['World Geography']);
  });

  it('offers to show all quizzes when none have the chosen status', async () => {
    const user = userEvent.setup();
    useSessionStore.setState({ userId: 'u5' });
    renderRoute('/quizzes');
    await card('JavaScript Basics');

    await choose('Status', 'Completed (0)');

    expect(screen.getByText('No quizzes are completed here.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show all quizzes' }));
    expect(cardTitles()).toHaveLength(4);
  });

  it('offers to resume a quiz that is in progress', async () => {
    renderRoute('/quizzes');
    const geography = await card('World Geography');

    expect(geography.getByText('In progress')).toBeInTheDocument();
    expect(geography.getByLabelText('2 of 5 answered')).toBeInTheDocument();
    expect(geography.getByText('3 left')).toBeInTheDocument();
    expect(geography.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', '/attempts/a11');
  });

  it('shows the best score and rank of a completed quiz that allows retakes', async () => {
    renderRoute('/quizzes');
    const javascript = await card('JavaScript Basics');

    expect(javascript.getByText('Completed')).toBeInTheDocument();
    expect(javascript.getByLabelText('Best score 83%')).toBeInTheDocument();
    expect(javascript.getByText('5 / 6 correct')).toBeInTheDocument();
    expect(javascript.getByRole('link', { name: 'Rank #3 of 4' })).toHaveAttribute('href', '/leaderboard/q1');
    expect(javascript.getByRole('link', { name: 'Retake' })).toHaveAttribute('href', '/quizzes/q1');
  });

  it('links to the previous result when retakes are not allowed', async () => {
    renderRoute('/quizzes');
    const react = await card('React Fundamentals');

    expect(react.getByText('Completed')).toBeInTheDocument();
    expect(react.queryByRole('link', { name: 'Retake' })).not.toBeInTheDocument();
    expect(react.getByRole('link', { name: 'View result' })).toHaveAttribute('href', '/attempts/a5/results');
  });

  it('offers to start a quiz that is not started', async () => {
    renderRoute('/quizzes');
    const kerala = await card('Kerala Culture and History');

    expect(kerala.queryByText('Not started')).not.toBeInTheDocument();
    expect(kerala.getByRole('img', { name: 'Available in India' })).toBeInTheDocument();
    expect(kerala.getByText('5 questions · 3:00 · Only once')).toBeInTheDocument();
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

  it('searches the quizzes by title or description', async () => {
    const user = userEvent.setup();
    renderRoute('/quizzes');
    await screen.findByText('Showing 4 quizzes');

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'hooks');
    await waitFor(() => {
      expect(cardTitles()).toEqual(['React Fundamentals']);
    });

    await user.clear(screen.getByRole('textbox', { name: 'Search' }));
    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'astronomy');
    expect(await screen.findByText('No quizzes match "astronomy".')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(await screen.findByText('Showing 4 quizzes')).toBeInTheDocument();
  });

  it('loads more quizzes as the list scrolls on a phone instead of showing pages', async () => {
    const user = userEvent.setup();
    const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
    await quizService.loadTestData();
    const total = (await quizService.getQuizzes(DEFAULT_USER_ID)).length;
    renderRoute('/quizzes');

    expect(await screen.findByText(`Showing 12 of ${String(total)} quizzes`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Page 2' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show more' }));

    expect(await screen.findByText(`Showing 24 of ${String(total)} quizzes`)).toBeInTheDocument();
    expect(cardTitles()).toHaveLength(24);
    matchMedia.mockRestore();
  });

  it('shows twelve quizzes per page and starts again at page 1 when the status changes', async () => {
    const user = userEvent.setup();
    await quizService.loadTestData();
    const total = (await quizService.getQuizzes(DEFAULT_USER_ID)).length;
    const { router } = renderRoute('/quizzes');

    expect(await screen.findByText(`Showing 1 to 12 of ${String(total)} quizzes`)).toBeInTheDocument();
    expect(cardTitles()).toHaveLength(12);
    await user.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(await screen.findByText(`Showing 13 to 24 of ${String(total)} quizzes`)).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: /^Completed/ }));
    expect(router.state.location.search).toBe('');
  });
});
