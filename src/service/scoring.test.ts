import { describe, expect, it } from 'vitest';
import { migrateSeed } from '../data/migrate';
import seed from '../data/seed.json';
import type { Answer, Question } from '../types/models';
import { isAnswerCorrect, summariseAttempt } from './scoring';

const singleChoice: Question = {
  id: 'capital',
  text: 'Capital of France?',
  type: 'single',
  options: [
    { id: 'paris', text: 'Paris' },
    { id: 'rome', text: 'Rome' },
    { id: 'madrid', text: 'Madrid' }
  ],
  correctOptionIds: ['paris']
};

const multipleChoice: Question = {
  id: 'primes',
  text: 'Which are prime?',
  type: 'multiple',
  options: [
    { id: 'two', text: '2' },
    { id: 'three', text: '3' },
    { id: 'four', text: '4' },
    { id: 'five', text: '5' }
  ],
  correctOptionIds: ['two', 'three', 'five']
};

const answer = (isCorrect: boolean): Answer => ({
  questionId: 'any',
  selectedOptionIds: [],
  isCorrect,
  answeredAt: '2026-10-17T10:00:00Z'
});

describe('isAnswerCorrect', () => {
  it('accepts the correct option of a single choice question', () => {
    expect(isAnswerCorrect(singleChoice, ['paris'])).toBe(true);
  });

  it('rejects a wrong option of a single choice question', () => {
    expect(isAnswerCorrect(singleChoice, ['rome'])).toBe(false);
  });

  it('rejects an empty selection', () => {
    expect(isAnswerCorrect(singleChoice, [])).toBe(false);
    expect(isAnswerCorrect(multipleChoice, [])).toBe(false);
  });

  it('accepts all correct options of a multiple choice question in any order', () => {
    expect(isAnswerCorrect(multipleChoice, ['five', 'two', 'three'])).toBe(true);
  });

  it('rejects a multiple choice answer that misses a correct option', () => {
    expect(isAnswerCorrect(multipleChoice, ['two', 'three'])).toBe(false);
  });

  it('rejects a multiple choice answer that adds a wrong option', () => {
    expect(isAnswerCorrect(multipleChoice, ['two', 'three', 'four', 'five'])).toBe(false);
  });

  it('rejects a multiple choice answer that swaps a correct option for a wrong one', () => {
    expect(isAnswerCorrect(multipleChoice, ['two', 'three', 'four'])).toBe(false);
  });
});

describe('summariseAttempt', () => {
  it('counts correct and incorrect answers', () => {
    const summary = summariseAttempt([answer(true), answer(false), answer(true)], 3);

    expect(summary).toEqual({ score: 2, totalQuestions: 3, correctCount: 2, incorrectCount: 1, percentage: 66.7 });
  });

  it('counts unanswered questions as incorrect', () => {
    const summary = summariseAttempt([answer(true), answer(true)], 5);

    expect(summary).toMatchObject({ score: 2, correctCount: 2, incorrectCount: 3, percentage: 40 });
  });

  it('rounds the percentage to one decimal place', () => {
    expect(summariseAttempt([answer(true), answer(true), answer(true), answer(true), answer(true)], 6).percentage).toBe(
      83.3
    );
    expect(summariseAttempt([answer(true)], 3).percentage).toBe(33.3);
  });

  it('gives 100 for all correct and 0 for none correct', () => {
    expect(summariseAttempt([answer(true), answer(true)], 2).percentage).toBe(100);
    expect(summariseAttempt([answer(false), answer(false)], 2).percentage).toBe(0);
  });

  it('matches the stored result of a completed seed attempt', () => {
    const attempt = migrateSeed(seed).attempts.find(item => item.id === 'a1');
    if (!attempt) throw new Error('Seed attempt a1 is missing');

    expect(summariseAttempt(attempt.answers, attempt.totalQuestions)).toMatchObject({
      score: attempt.score,
      percentage: attempt.percentage
    });
  });
});
