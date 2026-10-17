import { describe, expect, it } from 'vitest';
import { formatClock, formatDateTime, formatSeconds, formatTimeLimits, greetingFor } from './format';

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

describe('formatTimeLimits', () => {
  it('gives a main value and a detail line for every kind of limit', () => {
    expect(formatTimeLimits(300, null)).toEqual(['5 min', 'for the whole quiz']);
    expect(formatTimeLimits(null, 30)).toEqual(['30 s', 'for each question']);
    expect(formatTimeLimits(360, 45)).toEqual(['6 min overall', '45 s per question']);
    expect(formatTimeLimits(null, null)).toEqual(['No limit', 'untimed']);
  });
});

describe('formatDateTime', () => {
  const now = new Date(2026, 9, 17, 18, 0).getTime();
  const local = (day: number, hour: number, minute: number) => new Date(2026, 9, day, hour, minute).toISOString();

  it('says today or yesterday for recent times', () => {
    expect(formatDateTime(local(17, 14, 30), now)).toBe('today, 14:30');
    expect(formatDateTime(local(16, 9, 5), now)).toBe('yesterday, 09:05');
  });

  it('shows the date for older times', () => {
    expect(formatDateTime(local(1, 10, 0), now)).toBe('1 Oct 2026, 10:00');
  });
});

describe('greetingFor', () => {
  it('greets by the time of day', () => {
    expect(greetingFor(8)).toBe('Good morning');
    expect(greetingFor(13)).toBe('Good afternoon');
    expect(greetingFor(19)).toBe('Good evening');
  });
});
