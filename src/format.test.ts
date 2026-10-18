import { describe, expect, it } from 'vitest';
import {
  formatClock,
  formatCount,
  formatDateTime,
  formatScore,
  formatSeconds,
  formatTimerShort,
  greetingFor
} from './format';

describe('formatSeconds', () => {
  it('shows whole minutes, seconds, or both', () => {
    expect(formatSeconds(240)).toBe('4 min');
    expect(formatSeconds(45)).toBe('45 s');
    expect(formatSeconds(90)).toBe('1 min 30 s');
  });
});

describe('formatClock', () => {
  it('shows minutes and two digit seconds', () => {
    expect(formatClock(180)).toBe('3:00');
    expect(formatClock(142)).toBe('2:22');
    expect(formatClock(9)).toBe('0:09');
  });
});

describe('formatTimerShort', () => {
  it('describes every kind of time limit in a few characters', () => {
    expect(formatTimerShort(300, null)).toBe('5:00');
    expect(formatTimerShort(null, 30)).toBe('30 s / q');
    expect(formatTimerShort(360, 45)).toBe('6:00 + 45 s / q');
    expect(formatTimerShort(null, null)).toBeNull();
  });
});

describe('formatDateTime', () => {
  const now = new Date(2026, 9, 17, 18, 0).getTime();
  const local = (day: number, hour: number, minute: number) => new Date(2026, 9, day, hour, minute).toISOString();

  it('says Today or Yesterday for recent times', () => {
    expect(formatDateTime(local(17, 14, 30), now)).toBe('Today, 14:30');
    expect(formatDateTime(local(16, 9, 5), now)).toBe('Yesterday, 09:05');
  });

  it('shows the date for older times', () => {
    expect(formatDateTime(local(1, 10, 0), now)).toBe('1 Oct 2026, 10:00');
  });
});

describe('formatCount', () => {
  it('uses the singular for one and the plural otherwise', () => {
    expect(formatCount(1, 'attempt')).toBe('1 attempt');
    expect(formatCount(4, 'attempt')).toBe('4 attempts');
    expect(formatCount(5, 'quiz', 'quizzes')).toBe('5 quizzes');
  });
});

describe('formatScore', () => {
  it('shows the score out of the number of questions', () => {
    expect(formatScore(5, 6)).toBe('5/6');
  });
});

describe('greetingFor', () => {
  it('greets by the time of day', () => {
    expect(greetingFor(8)).toBe('Good morning');
    expect(greetingFor(13)).toBe('Good afternoon');
    expect(greetingFor(19)).toBe('Good evening');
  });
});
