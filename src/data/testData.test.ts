import { describe, expect, it } from 'vitest';
import { migrateSeed } from './migrate';
import { parseQuizData } from './schema';
import seed from './seed.json';
import { addTestData } from './testData';

const NOW = Date.parse('2026-10-18T10:00:00Z');

describe('addTestData', () => {
  it('adds quizzes, users and attempts that pass the data schema', () => {
    const data = addTestData(migrateSeed(seed), NOW);

    expect(() => parseQuizData(data)).not.toThrow();
    expect(data.quizzes).toHaveLength(50);
    expect(data.users).toHaveLength(50);
    expect(data.attempts.length).toBeGreaterThan(300);
  });

  it('keeps the seed data and gives every new user attempts on the seed quizzes', () => {
    const base = migrateSeed(seed);
    const data = addTestData(base, NOW);
    const playersOnQ1 = new Set(data.attempts.filter(attempt => attempt.quizId === 'q1').map(item => item.userId));

    expect(data.quizzes.slice(0, base.quizzes.length)).toEqual(base.quizzes);
    expect(playersOnQ1.size).toBeGreaterThan(10);
  });

  it('creates the same data every time', () => {
    expect(addTestData(migrateSeed(seed), NOW)).toEqual(addTestData(migrateSeed(seed), NOW));
  });
});
