import { expect, test } from '@playwright/test';
import seed from '../src/data/seed.json' with { type: 'json' };

const quiz = seed.quizzes.find(item => item.id === 'q3');

test('a user takes a quiz from start to the leaderboard', async ({ page }) => {
  if (!quiz) throw new Error('Seed quiz q3 is missing');

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Your quizzes' })).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: /Simulate slow network/ }).uncheck();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: /^Viewing as/ }).click();
  await page.getByRole('option', { name: 'Diya Nair' }).click();
  await expect(page.getByRole('button', { name: 'Viewing as: Diya Nair' })).toBeVisible();

  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: quiz.title }) });
  await card.getByRole('link', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Start quiz' }).click();

  for (const [index, question] of quiz.questions.entries()) {
    await expect(page.getByText(`Question ${String(index + 1)} of ${String(quiz.questions.length)}`)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: question.text })).toBeVisible();
    const role = question.type === 'single' ? 'radio' : 'checkbox';
    for (const option of question.options.filter(item => question.correctOptionIds.includes(item.id))) {
      await page.getByRole(role, { name: option.text }).check();
    }
    await page.getByRole('button', { name: 'Submit answer' }).click();
  }

  await expect(page).toHaveURL(/\/attempts\/.+\/results$/);
  await expect(page.getByRole('heading', { level: 1, name: quiz.title })).toBeVisible();
  await expect(
    page.getByText(`You scored ${String(quiz.questions.length)} out of ${String(quiz.questions.length)}`)
  ).toBeVisible();

  await page.getByRole('link', { name: /Your ranking/ }).click();
  await expect(page).toHaveURL(/\/leaderboard\/q3$/);
  const myRow = page.getByRole('table').getByRole('row').filter({ hasText: 'Diya Nair' });
  await expect(myRow).toHaveAttribute('aria-current', 'true');
  await expect(myRow).toContainText('5/5');
});
