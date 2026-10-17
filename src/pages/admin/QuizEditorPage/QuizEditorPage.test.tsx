import { notifications } from '@mantine/notifications';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { quizService } from '../../../service/quizService';
import { renderRoute } from '../../../test/renderWithProviders';

const titleInput = () => screen.findByRole('textbox', { name: /Title/ });

describe('QuizEditorPage', () => {
  beforeEach(async () => {
    notifications.clean();
    await quizService.resetData();
  });

  it('shows the stored details of the quiz being edited', async () => {
    renderRoute('/admin/quizzes/q5/edit');

    expect(await titleInput()).toHaveValue('General Science');
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('Physics, chemistry and biology basics.');
    expect(screen.getByRole('checkbox', { name: 'Whole quiz' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Minutes for the whole quiz' })).toHaveValue('6');
    expect(screen.getByRole('checkbox', { name: 'Each question' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Seconds for each question' })).toHaveValue('45');
    expect(screen.getByRole('switch', { name: 'Allow retakes' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'United Arab Emirates' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'India' })).not.toBeChecked();
    expect(screen.getByRole('heading', { name: 'Questions (6)' })).toBeInTheDocument();
  });

  it('shows inline errors and does not save an invalid quiz', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');

    await user.clear(await titleInput());
    await user.click(screen.getByRole('checkbox', { name: 'United Arab Emirates' }));
    await user.click(screen.getByRole('checkbox', { name: 'United Kingdom' }));
    await user.clear(screen.getByRole('textbox', { name: 'Minutes for the whole quiz' }));
    await user.click(screen.getByRole('button', { name: 'Save quiz' }));

    expect(await screen.findByText('Enter a title')).toBeInTheDocument();
    expect(screen.getByText('Pick at least one country')).toBeInTheDocument();
    expect(screen.getByText('Enter a whole number above 0')).toBeInTheDocument();
    await expect(quizService.getQuizForEdit('q5')).resolves.toMatchObject({ title: 'General Science' });
  });

  it('saves the changes and returns to the quiz list', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin/quizzes/q5/edit');

    await user.type(await titleInput(), ' Quiz');
    await user.click(screen.getByRole('checkbox', { name: 'Each question' }));
    await user.click(screen.getByRole('button', { name: 'Save quiz' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin');
    });
    expect(await screen.findByText('General Science Quiz saved')).toBeInTheDocument();
    await expect(quizService.getQuizForEdit('q5')).resolves.toMatchObject({
      title: 'General Science Quiz',
      timeLimitSeconds: 360,
      perQuestionSeconds: null,
      version: 2
    });
  });

  it('marks the form as having unsaved changes after an edit', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');

    await titleInput();
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Allow retakes' }));

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('asks for a question before a new quiz can be created', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin/quizzes/new');

    await user.type(await titleInput(), 'Astronomy');
    await user.click(screen.getByRole('checkbox', { name: 'India' }));
    await user.click(screen.getByRole('button', { name: 'Create quiz' }));

    expect(await screen.findByText('Add at least one question')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/quizzes/new');
  });

  it('says when the quiz to edit does not exist', async () => {
    renderRoute('/admin/quizzes/q99/edit');

    expect(await screen.findByRole('heading', { name: 'Quiz not found' })).toBeInTheDocument();
  });
});
