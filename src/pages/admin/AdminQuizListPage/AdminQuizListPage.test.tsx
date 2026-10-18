import { notifications } from '@mantine/notifications';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { quizService } from '../../../service/quizService';
import { useSessionStore } from '../../../session/sessionStore';
import { exampleQuiz } from '../../../components/ImportQuizButton/data';
import { renderRoute } from '../../../test/renderWithProviders';

const rowTitles = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map(row => within(row).getAllByRole('cell')[0]?.querySelector('p')?.textContent);

const waitForRows = async () => {
  await screen.findByRole('table');
};

const importInput = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Import JSON' }));
  return screen.findByLabelText('Quiz file to import');
};

const firstButton = (name: string) => {
  const [button] = screen.getAllByRole('button', { name });
  if (!button) throw new Error(`No button named ${name}`);
  return button;
};

describe('AdminQuizListPage', () => {
  beforeAll(async () => {
    await import('.');
  });

  beforeEach(async () => {
    notifications.clean();
    useSessionStore.setState({ userId: 'u5', countryFilter: null, slowNetwork: false });
    await quizService.resetData();
  });

  it('lists every quiz with its details, sorted by title', async () => {
    renderRoute('/admin');
    await waitForRows();

    expect(screen.getByText('5 quizzes · 11 attempts recorded')).toBeInTheDocument();
    expect(rowTitles()).toEqual([
      'General Science',
      'JavaScript Basics',
      'Kerala Culture and History',
      'React Fundamentals',
      'World Geography'
    ]);
    const science = within(screen.getByRole('table')).getAllByRole('row')[1];
    expect(science).toHaveTextContent('6:00 + 45 s / q');
    expect(science).toHaveTextContent('Retakes allowed');
    expect(within(screen.getByRole('table')).getAllByRole('row')[3]).toHaveTextContent('No retakes');
    expect(
      within(science as HTMLElement).getByRole('img', { name: 'Available in United Arab Emirates, United Kingdom' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Edit General Science' })[0]).toHaveAttribute(
      'href',
      '/admin/quizzes/q5/edit'
    );
  });

  it('searches by title or description and keeps the search in the URL', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin');
    await waitForRows();

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'hooks');

    await waitFor(() => {
      expect(router.state.location.search).toBe('?q=hooks');
    });
    expect(rowTitles()).toEqual(['React Fundamentals']);
  });

  it('offers to clear a search that matches nothing', async () => {
    const user = userEvent.setup();
    renderRoute('/admin?q=astronomy');

    expect(await screen.findByText('No quizzes match "astronomy".')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => {
      expect(rowTitles()).toHaveLength(5);
    });
  });

  it('filters by country and keeps the countries in the URL', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin');
    await waitForRows();

    await user.click(screen.getByRole('button', { name: 'Country: All countries' }));
    await user.click(await screen.findByRole('option', { name: 'United Arab Emirates' }));

    expect(rowTitles()).toEqual(['General Science', 'JavaScript Basics', 'World Geography']);
    expect(router.state.location.search).toBe('?countries=AE');
  });

  it('filters by whether retakes are allowed', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin');
    await waitForRows();

    await user.click(screen.getByRole('combobox', { name: 'Retakes' }));
    await user.click(await screen.findByRole('option', { name: 'Not allowed' }));

    expect(rowTitles()).toEqual(['Kerala Culture and History', 'React Fundamentals']);
    expect(router.state.location.search).toBe('?retakes=not_allowed');
  });

  it('offers to clear filters that match nothing', async () => {
    const user = userEvent.setup();
    renderRoute('/admin?countries=AE&retakes=not_allowed');

    expect(await screen.findByText('No quizzes match these filters.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => {
      expect(rowTitles()).toHaveLength(5);
    });
  });

  it('sorts by the number of attempts', async () => {
    const user = userEvent.setup();
    renderRoute('/admin');
    await waitForRows();

    await user.click(screen.getByRole('combobox', { name: 'Sort by' }));
    await user.click(await screen.findByRole('option', { name: 'Most attempts' }));

    expect(rowTitles().slice(0, 3)).toEqual(['JavaScript Basics', 'World Geography', 'React Fundamentals']);
  });

  it('sorts by the fewest attempts, then by title', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin');
    await waitForRows();

    await user.click(screen.getByRole('combobox', { name: 'Sort by' }));
    await user.click(await screen.findByRole('option', { name: 'Fewest attempts' }));

    expect(rowTitles().slice(0, 3)).toEqual(['General Science', 'Kerala Culture and History', 'React Fundamentals']);
    expect(router.state.location.search).toBe('?sort=attempts_asc');
  });

  it('shows ten quizzes per page', async () => {
    const user = userEvent.setup();
    const base = await quizService.getQuizForEdit('q1');
    for (let number = 1; number <= 10; number++) {
      await quizService.createQuiz({ ...base, title: `Practice ${String(number).padStart(2, '0')}` });
    }
    renderRoute('/admin');
    await waitForRows();

    expect(rowTitles()).toHaveLength(10);
    await user.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(rowTitles()).toEqual(['Practice 08', 'Practice 09', 'Practice 10', 'React Fundamentals', 'World Geography']);
  });

  it('deletes a quiz with its attempts after confirming', async () => {
    const user = userEvent.setup();
    renderRoute('/admin');
    await waitForRows();

    await user.click(firstButton('Delete JavaScript Basics'));
    const dialog = await screen.findByRole('dialog', { name: 'Delete quiz?' });
    expect(dialog).toHaveTextContent('JavaScript Basics');
    expect(dialog).toHaveTextContent('Its 4 attempts and its leaderboard are deleted too.');
    await user.click(within(dialog).getByRole('button', { name: 'Yes' }));

    await waitFor(() => {
      expect(rowTitles()).not.toContain('JavaScript Basics');
    });
    expect(screen.getByText('4 quizzes · 7 attempts recorded')).toBeInTheDocument();
    expect(await screen.findByText('Quiz deleted')).toBeInTheDocument();
  });

  it('says so when the quiz was already deleted before the delete is confirmed', async () => {
    const user = userEvent.setup();
    renderRoute('/admin');
    await waitForRows();

    await user.click(firstButton('Delete JavaScript Basics'));
    const dialog = await screen.findByRole('dialog', { name: 'Delete quiz?' });
    await quizService.deleteQuiz('q1');
    await user.click(within(dialog).getByRole('button', { name: 'Yes' }));

    expect(await screen.findByText("Couldn't delete the quiz. It may already have been deleted.")).toBeInTheDocument();
  });

  it('keeps the quiz when the delete is cancelled', async () => {
    const user = userEvent.setup();
    renderRoute('/admin');
    await waitForRows();

    await user.click(firstButton('Delete JavaScript Basics'));
    const dialog = await screen.findByRole('dialog', { name: 'Delete quiz?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await expect(quizService.getQuiz('q1')).resolves.toMatchObject({ id: 'q1' });
    expect(rowTitles()).toContain('JavaScript Basics');
  });

  it('downloads a quiz as a JSON file named after its title', async () => {
    const user = userEvent.setup();
    const blobs: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob);
      return 'blob:quiz';
    });
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderRoute('/admin');

    await waitForRows();
    await user.click(firstButton('Export JavaScript Basics as JSON'));

    await waitFor(() => {
      expect(click).toHaveBeenCalledOnce();
    });
    expect(click.mock.contexts[0]).toHaveProperty('download', 'javascript-basics.json');
    const [blob] = blobs;
    expect(JSON.parse((await blob?.text()) ?? '')).toMatchObject({ title: 'JavaScript Basics' });
    click.mockRestore();
  });

  it('imports a quiz from a JSON file', async () => {
    const user = userEvent.setup();
    const exported = await quizService.exportQuiz('q1');
    renderRoute('/admin');

    await waitForRows();
    const file = new File([JSON.stringify({ ...exported, title: 'Imported basics' })], 'quiz.json', {
      type: 'application/json'
    });
    await user.upload(await importInput(user), file);

    expect(await screen.findByText('Quiz imported')).toBeInTheDocument();
    await waitFor(() => {
      expect(rowTitles()).toContain('Imported basics');
    });
  });

  it('lists the problems of a file that is not a valid quiz', async () => {
    const user = userEvent.setup();
    renderRoute('/admin');

    await waitForRows();
    const file = new File([JSON.stringify({ title: '', questions: [] })], 'quiz.json', { type: 'application/json' });
    await user.upload(await importInput(user), file);

    const dialog = await screen.findByRole('dialog', { name: "Couldn't import this file" });
    expect(within(dialog).getByText('Title: Enter a title')).toBeInTheDocument();
    expect(within(dialog).getByText('Description: Missing or not the right kind of value')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(6);
    expect(within(dialog).getByText('And 2 more problems.')).toBeInTheDocument();
  });

  it('says when the file is not JSON', async () => {
    const user = userEvent.setup();
    renderRoute('/admin');

    await waitForRows();
    await user.upload(await importInput(user), new File(['not json'], 'quiz.json'));

    const dialog = await screen.findByRole('dialog', { name: "Couldn't import this file" });
    expect(within(dialog).getByText("This file isn't valid JSON.")).toBeInTheDocument();
  });

  it('shows the expected format with an example that imports as it is', async () => {
    const user = userEvent.setup();
    renderRoute('/admin');

    await waitForRows();
    const input = await importInput(user);
    const dialog = screen.getByRole('dialog', { name: 'Import a quiz' });
    expect(within(dialog).getByText('Example file')).toBeInTheDocument();
    expect(within(dialog).getByText(/"title": "Space Basics"/)).toBeInTheDocument();
    await user.upload(
      input,
      new File([JSON.stringify(exampleQuiz)], 'space-basics.json', { type: 'application/json' })
    );

    expect(await screen.findByText('Quiz imported')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Import a quiz' })).not.toBeInTheDocument();
  });
});
