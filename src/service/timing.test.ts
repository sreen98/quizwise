import { describe, expect, it } from 'vitest';
import type { Answer } from '../types/models';
import { getDeadlines, questionStartedAt } from './timing';

const START = '2026-10-17T10:00:00Z';
const at = (seconds: number) => Date.parse(START) + seconds * 1000;

const answeredAfter = (seconds: number): Answer => ({
  questionId: `question-${String(seconds)}`,
  selectedOptionIds: ['a'],
  isCorrect: true,
  answeredAt: new Date(at(seconds)).toISOString()
});

const attempt = (answers: Answer[] = []) => ({ startedAt: START, answers });
const limits = (timeLimitSeconds: number | null, perQuestionSeconds: number | null) => ({
  timeLimitSeconds,
  perQuestionSeconds
});

describe('questionStartedAt', () => {
  it('uses the attempt start for the first question', () => {
    expect(questionStartedAt(attempt())).toBe(at(0));
  });

  it('uses the time of the last answer for later questions', () => {
    expect(questionStartedAt(attempt([answeredAfter(20), answeredAfter(45)]))).toBe(at(45));
  });
});

describe('getDeadlines', () => {
  it('has no deadlines when the quiz has no time limits', () => {
    expect(getDeadlines(limits(null, null), attempt())).toEqual({
      overallDeadlineAt: null,
      questionDeadlineAt: null,
      deadlineAt: null
    });
  });

  it('counts an overall limit from the attempt start', () => {
    expect(getDeadlines(limits(300, null), attempt([answeredAfter(100)]))).toEqual({
      overallDeadlineAt: at(300),
      questionDeadlineAt: null,
      deadlineAt: at(300)
    });
  });

  it('counts a per question limit from when the current question started', () => {
    expect(getDeadlines(limits(null, 30), attempt())).toMatchObject({ questionDeadlineAt: at(30), deadlineAt: at(30) });
    expect(getDeadlines(limits(null, 30), attempt([answeredAfter(25)]))).toMatchObject({
      questionDeadlineAt: at(55),
      deadlineAt: at(55)
    });
  });

  it('uses the per question deadline when it comes first', () => {
    expect(getDeadlines(limits(360, 45), attempt([answeredAfter(35)]))).toEqual({
      overallDeadlineAt: at(360),
      questionDeadlineAt: at(80),
      deadlineAt: at(80)
    });
  });

  it('uses the overall deadline when it comes first', () => {
    expect(getDeadlines(limits(360, 45), attempt([answeredAfter(340)]))).toEqual({
      overallDeadlineAt: at(360),
      questionDeadlineAt: at(385),
      deadlineAt: at(360)
    });
  });

  it('puts the seed attempt a11 deadline four minutes after it started', () => {
    const a11 = {
      startedAt: '2026-10-16T09:00:00Z',
      answers: [answeredAfter(0), answeredAfter(0)].map(answer => ({ ...answer, answeredAt: '2026-10-16T09:00:00Z' }))
    };

    expect(getDeadlines(limits(240, null), a11).deadlineAt).toBe(Date.parse('2026-10-16T09:04:00Z'));
  });
});
