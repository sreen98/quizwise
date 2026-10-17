import { describe, expect, it } from 'vitest';
import type { Attempt } from '../types/models';
import { rankBestAttempts } from './ranking';

const attempt = (id: string, userId: string, changes: Partial<Attempt> = {}): Attempt => ({
  id,
  quizId: 'quiz',
  userId,
  quizVersion: 1,
  status: 'completed',
  endReason: 'submitted',
  startedAt: '2026-10-17T10:00:00Z',
  currentQuestionIndex: 5,
  answers: [],
  draftOptionIds: [],
  completedAt: '2026-10-17T10:02:00Z',
  score: 3,
  totalQuestions: 5,
  percentage: 60,
  timeTakenSeconds: 120,
  ...changes
});

const order = (attempts: Attempt[]) => rankBestAttempts(attempts).map(item => item.id);

describe('rankBestAttempts', () => {
  it('ranks a higher score first', () => {
    expect(order([attempt('low', 'u1', { score: 2 }), attempt('high', 'u2', { score: 4 })])).toEqual(['high', 'low']);
  });

  it('ranks the faster player first when scores tie', () => {
    expect(
      order([attempt('slow', 'u1', { timeTakenSeconds: 150 }), attempt('fast', 'u2', { timeTakenSeconds: 90 })])
    ).toEqual(['fast', 'slow']);
  });

  it('ranks the earlier finisher first when score and time both tie', () => {
    expect(
      order([
        attempt('later', 'u1', { completedAt: '2026-10-17T11:00:00Z' }),
        attempt('earlier', 'u2', { completedAt: '2026-10-17T09:00:00Z' })
      ])
    ).toEqual(['earlier', 'later']);
  });

  it('keeps only the best attempt of each user', () => {
    expect(
      order([attempt('first', 'u1', { score: 2 }), attempt('second', 'u1', { score: 5 }), attempt('other', 'u2')])
    ).toEqual(['second', 'other']);
  });

  it('ignores attempts that are not completed', () => {
    expect(
      order([
        attempt('open', 'u1', { status: 'in_progress', score: null }),
        attempt('closed', 'u2', { status: 'closed' })
      ])
    ).toEqual([]);
  });
});
