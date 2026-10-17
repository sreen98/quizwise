import { notifications } from '@mantine/notifications';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { quizService } from '../../../service/quizService';
import { useSessionStore } from '../../../session/sessionStore';
import { renderRoute } from '../../../test/renderWithProviders';

const rowTitles = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map(row => within(row).getAllByRole('cell')[0]?.querySelector('p')?.textContent);

const waitForRows = async () => {
  await screen.findByRole('table');
};

const firstButton = (name: string) => {
  const [button] = screen.getAllByRole('button', { name });
  if (!button) throw new Error(`No button named ${name}`);
  return button;
};

describe('AdminQuizListPage', () => {
  beforeEach(async () => {
    notifications.clean();
    useSessionStore.setState({ userId: 'u5', country: null, slowNetwork: false });
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
    expect(science).toHaveTextContent('AEGB');
    expect(screen.getAllByRole('link', { name: 'Edit General Science' })[0]).toHaveAttribute(
      'href',
      '/admin/quizzes/q5/edit'
    );
  });

  it('searches by title or description and keeps the search in the URL', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin');
    await waitForRows();

    await user.type(screen.getByRole('textbox', { name: 'Search quizzes' }), 'hooks');

    expect(rowTitles()).toEqual(['React Fundamentals']);
    expect(router.state.location.search).toBe('?q=hooks');
  });

  it('offers to clear a search that matches nothing', async () => {
    const user = userEvent.setup();
    renderRoute('/admin?q=astronomy');

    expect(await screen.findByText('No quizzes match "astronomy".')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(rowTitles()).toHaveLength(5);
  });

  it('sorts by the number of attempts', async () => {
    const user = userEvent.setup();
    renderRoute('/admin');
    await waitForRows();

    await user.click(screen.getByRole('combobox', { name: 'Sort by' }));
    await user.click(await screen.findByRole('option', { name: 'Most attempts' }));

    expect(rowTitles().slice(0, 3)).toEqual(['JavaScript Basics', 'World Geography', 'React Fundamentals']);
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
    const dialog = await screen.findByRole('dialog', { name: 'Delete JavaScript Basics?' });
    expect(dialog).toHaveTextContent('Its 4 attempts and its leaderboard are deleted too.');
    await user.click(within(dialog).getByRole('button', { name: 'Delete quiz' }));

    await waitFor(() => {
      expect(rowTitles()).not.toContain('JavaScript Basics');
    });
    expect(screen.getByText('4 quizzes · 7 attempts recorded')).toBeInTheDocument();
    expect(await screen.findByText('JavaScript Basics deleted')).toBeInTheDocument();
  });

  it('says so when the quiz was already deleted before the delete is confirmed', async () => {
    const user = userEvent.setup();
    renderRoute('/admin');
    await waitForRows();

    await user.click(firstButton('Delete JavaScript Basics'));
    const dialog = await screen.findByRole('dialog', { name: 'Delete JavaScript Basics?' });
    await quizService.deleteQuiz('q1');
    await user.click(within(dialog).getByRole('button', { name: 'Delete quiz' }));

    expect(
      await screen.findByText("Couldn't delete JavaScript Basics. It may already have been deleted.")
    ).toBeInTheDocument();
  });

  it('keeps the quiz when the delete is cancelled', async () => {
    const user = userEvent.setup();
    renderRoute('/admin');
    await waitForRows();

    await user.click(firstButton('Delete JavaScript Basics'));
    const dialog = await screen.findByRole('dialog', { name: 'Delete JavaScript Basics?' });
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
    await user.upload(screen.getByLabelText('Quiz file to import'), file);

    expect(await screen.findByText('Imported basics imported')).toBeInTheDocument();
    await waitFor(() => {
      expect(rowTitles()).toContain('Imported basics');
    });
  });

  it('lists the problems of a file that is not a valid quiz', async () => {
    const user = userEvent.setup();
    renderRoute('/admin');

    await waitForRows();
    const file = new File([JSON.stringify({ title: '', questions: [] })], 'quiz.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Quiz file to import'), file);

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
    await user.upload(screen.getByLabelText('Quiz file to import'), new File(['not json'], 'quiz.json'));

    const dialog = await screen.findByRole('dialog', { name: "Couldn't import this file" });
    expect(within(dialog).getByText("This file isn't valid JSON.")).toBeInTheDocument();
  });
});
