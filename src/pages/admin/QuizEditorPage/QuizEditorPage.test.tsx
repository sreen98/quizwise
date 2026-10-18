import { notifications } from '@mantine/notifications';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { quizService } from '../../../service/quizService';
import { useSessionStore } from '../../../session/sessionStore';
import { renderRoute } from '../../../test/renderWithProviders';

const titleInput = () => screen.findByRole('textbox', { name: /Title/ });

const toggleCountry = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('combobox', { name: 'Available in' }));
  await user.click(await screen.findByRole('option', { name }));
};

const fillDetails = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(await titleInput(), 'Astronomy');
  await toggleCountry(user, 'India');
  await user.click(screen.getByRole('button', { name: 'Next' }));
};

describe('QuizEditorPage', () => {
  beforeAll(async () => {
    await import('.');
  });

  beforeEach(async () => {
    notifications.clean();
    useSessionStore.setState({ userId: 'u5', country: null, slowNetwork: false });
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
    expect(screen.getByRole('button', { name: 'Remove United Arab Emirates' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove United Kingdom' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove India' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Questions (6)' })).toBeInTheDocument();
  });

  it('shows inline errors and does not save an invalid quiz', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');

    await user.clear(await titleInput());
    await toggleCountry(user, 'United Arab Emirates');
    await toggleCountry(user, 'United Kingdom');
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

  it('asks for the details first and moves on only when they are valid', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/new');

    await titleInput();
    expect(screen.queryByRole('heading', { name: /Questions/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Enter a title')).toBeInTheDocument();
    expect(screen.getByText('Pick at least one country')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /Title/ })).toHaveFocus();
    });
    expect(screen.queryByRole('heading', { name: /Questions/ })).not.toBeInTheDocument();
  });

  it('opens the questions step with the first question ready to fill in', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/new');

    await fillDetails(user);

    expect(await screen.findByRole('heading', { name: 'Questions (1)' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Question text' })).toHaveFocus();
    });
    expect(screen.getByRole('button', { name: 'Add another question' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('Astronomy');
  });

  it('asks for a question before a new quiz can be created', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin/quizzes/new');

    await fillDetails(user);
    await user.click(await screen.findByRole('button', { name: 'Delete question 1' }));
    await user.click(screen.getByRole('button', { name: 'Create quiz' }));

    expect(await screen.findByText('Add at least one question')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/quizzes/new');
  });

  it('creates a new quiz with a question built from scratch', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin/quizzes/new');

    await fillDetails(user);
    await user.type(await screen.findByRole('textbox', { name: 'Question text' }), 'Which planet is largest?');
    await user.type(screen.getByRole('textbox', { name: 'Option 1' }), 'Mars');
    await user.type(screen.getByRole('textbox', { name: 'Option 2' }), 'Jupiter');
    await user.click(screen.getByRole('checkbox', { name: 'Option 2 is correct' }));
    await user.click(screen.getByRole('button', { name: 'Create quiz' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin');
    });
    const created = (await quizService.getAdminQuizzes()).find(quiz => quiz.title === 'Astronomy');
    expect(created).toMatchObject({ questionCount: 1, countries: ['IN'], questionTypes: ['single'] });
  });

  it('shows the problems of an incomplete question when saving', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/new');

    await fillDetails(user);
    await user.click(await screen.findByRole('button', { name: 'Create quiz' }));

    expect(await screen.findByText('Enter the question text')).toBeInTheDocument();
    expect(screen.getAllByText('Enter the option text')).toHaveLength(2);
    expect(screen.getByText('Mark at least one correct option')).toBeInTheDocument();
    expect(screen.getByText('4 problems')).toBeInTheDocument();
  });

  it('allows only one correct answer for a single choice question', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');

    await user.click(await screen.findByRole('button', { name: 'Edit question 1' }));
    await user.click(screen.getByRole('checkbox', { name: 'Option 1 is correct' }));

    expect(screen.getByRole('checkbox', { name: 'Option 1 is correct' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Option 2 is correct' })).not.toBeChecked();
  });

  it('keeps one correct answer when a multiple choice question becomes single choice', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');

    await user.click(await screen.findByRole('button', { name: 'Edit question 2' }));
    expect(screen.getByRole('checkbox', { name: 'Option 3 is correct' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Allow multiple answers' })).toBeChecked();
    await user.click(screen.getByRole('switch', { name: 'Allow multiple answers' }));

    expect(screen.getByRole('checkbox', { name: 'Option 1 is correct' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Option 3 is correct' })).not.toBeChecked();
  });

  it('adds and removes options', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');

    await user.click(await screen.findByRole('button', { name: 'Edit question 1' }));
    await user.click(screen.getByRole('button', { name: 'Add option' }));
    expect(screen.getByRole('textbox', { name: 'Option 5' })).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'Remove option 5' }));
    expect(screen.queryByRole('textbox', { name: 'Option 5' })).not.toBeInTheDocument();
  });

  it('collapses and deletes questions', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');

    await user.click(await screen.findByRole('button', { name: 'Edit question 2' }));
    expect(screen.getByRole('textbox', { name: 'Question text' })).toHaveValue('Which of these are noble gases?');
    await user.click(screen.getByRole('button', { name: 'Collapse question 2' }));
    expect(screen.queryByRole('textbox', { name: 'Question text' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit question 2' }));
    await user.click(screen.getByRole('button', { name: 'Delete question 2' }));

    expect(screen.getByRole('heading', { name: 'Questions (5)' })).toBeInTheDocument();
    expect(screen.queryByText('Which of these are noble gases?')).not.toBeInTheDocument();
  });

  it('moves a question with the keyboard using its drag handle', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');
    const handle = await screen.findByRole('button', { name: 'Reorder question 1' });
    const rows = () => [...document.querySelectorAll('section[aria-labelledby="questions-title"] ol > li')];
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const row = rows().findIndex(item => item === this || item.contains(this));
      const top = Math.max(row, 0) * 70;
      return { x: 0, y: top, top, left: 0, width: 600, height: 60, right: 600, bottom: top + 60, toJSON: () => ({}) };
    });

    handle.focus();
    await user.keyboard(' ');
    expect(await screen.findByText('Picked up question 1.')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    expect(await screen.findByText('Question 1 is over position 2.')).toBeInTheDocument();
    await user.keyboard('{ArrowUp}');
    expect(await screen.findByText('Question 1 is over position 1.')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}');
    expect(await screen.findByText('Question 1 is over position 2.')).toBeInTheDocument();
    await user.keyboard(' ');
    expect(await screen.findByText('Question 1 dropped at position 2.')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit question 2' })).toHaveTextContent('What is the chemical symbol');
    });
    expect(screen.getByRole('button', { name: 'Edit question 1' })).toHaveTextContent(
      'Which of these are noble gases?'
    );
    vi.restoreAllMocks();
  });

  it('leaves without asking when nothing has changed', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin/quizzes/q5/edit');

    await titleInput();
    await user.click(screen.getByRole('link', { name: 'Cancel' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin');
    });
    expect(screen.queryByRole('dialog', { name: 'Leave without saving?' })).not.toBeInTheDocument();
  });

  it('asks before leaving with unsaved changes and stays when the admin keeps editing', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin/quizzes/q5/edit');

    await user.type(await titleInput(), ' Quiz');
    await user.click(screen.getByRole('link', { name: 'Cancel' }));
    await user.click(await screen.findByRole('button', { name: 'Keep editing' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Leave without saving?' })).not.toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe('/admin/quizzes/q5/edit');
    expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('General Science Quiz');

    await user.click(screen.getByRole('link', { name: 'Cancel' }));
    expect(await screen.findByRole('dialog', { name: 'Leave without saving?' })).toBeInTheDocument();
  });

  it('leaves and drops the changes when the admin confirms', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin/quizzes/q5/edit');

    await user.type(await titleInput(), ' Quiz');
    await user.click(screen.getByRole('link', { name: 'Back to Manage quizzes' }));
    await user.click(await screen.findByRole('button', { name: 'Leave' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin');
    });
    await expect(quizService.getQuizForEdit('q5')).resolves.toMatchObject({ title: 'General Science' });
  });

  it('warns the browser before unloading only while there are unsaved changes', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');
    const unload = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };

    await titleInput();
    expect(unload()).toBe(false);
    await user.type(await titleInput(), ' Quiz');
    expect(unload()).toBe(true);
  });

  it('asks before switching user with unsaved changes and stays when the admin keeps editing', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');

    await user.type(await titleInput(), ' Quiz');
    await user.click(screen.getByRole('combobox', { name: 'Viewing as' }));
    await user.click(await screen.findByRole('option', { name: 'Aarav Menon' }));
    await user.click(await screen.findByRole('button', { name: 'Keep editing' }));

    expect(useSessionStore.getState().userId).toBe('u5');
    expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('General Science Quiz');
  });

  it('switches user and drops the changes when the admin confirms', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');

    await user.type(await titleInput(), ' Quiz');
    await user.click(screen.getByRole('combobox', { name: 'Viewing as' }));
    await user.click(await screen.findByRole('option', { name: 'Aarav Menon' }));
    await user.click(await screen.findByRole('button', { name: 'Switch user' }));

    expect(await screen.findByRole('heading', { name: "You don't have access to this page" })).toBeInTheDocument();
    expect(useSessionStore.getState()).toMatchObject({ userId: 'u1', hasUnsavedChanges: false });
  });

  it('says so and stays on the form when the quiz was deleted before saving', async () => {
    const user = userEvent.setup();
    const { router } = renderRoute('/admin/quizzes/q5/edit');

    await user.type(await titleInput(), ' Quiz');
    await quizService.deleteQuiz('q5');
    await user.click(screen.getByRole('button', { name: 'Save quiz' }));

    expect(
      await screen.findByText("Couldn't save General Science Quiz. The quiz may have been deleted.")
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/quizzes/q5/edit');
  });

  it('moves focus to the first field with a problem when saving fails validation', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');

    await user.clear(await titleInput());
    await user.click(screen.getByRole('button', { name: 'Save quiz' }));

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /Title/ })).toHaveFocus();
    });
  });

  it('adds a question and moves the cursor into it', async () => {
    const user = userEvent.setup();
    renderRoute('/admin/quizzes/q5/edit');

    await titleInput();
    await user.click(screen.getByRole('button', { name: 'Add another question' }));

    expect(screen.getByRole('heading', { name: 'Questions (7)' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: 'Question text' })).toHaveFocus();
    });
  });

  it('says when the quiz to edit does not exist', async () => {
    renderRoute('/admin/quizzes/q99/edit');

    expect(await screen.findByRole('heading', { name: 'Quiz not found' })).toBeInTheDocument();
  });
});
