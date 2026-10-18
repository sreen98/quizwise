import { describe, expect, it } from 'vitest';
import type { Leaderboard, LeaderboardEntry } from '../../service/types';
import { standingLine } from './standing';

const entry = (rank: number, userName: string, score: number, timeTakenSeconds: number): LeaderboardEntry => ({
  rank,
  userId: `u${String(rank)}`,
  userName,
  country: 'IN',
  countryName: 'India',
  score,
  totalQuestions: 6,
  percentage: Math.round((score / 6) * 1000) / 10,
  timeTakenSeconds,
  completedAt: '2026-10-01T10:00:00Z'
});

const board = (entries: LeaderboardEntry[]): Leaderboard => ({
  quizTitle: 'JavaScript Basics',
  retakesAllowed: true,
  entries,
  currentUser: null,
  rankedCount: entries.length
});

describe('standingLine', () => {
  it('congratulates the player in first place', () => {
    const first = entry(1, 'Fatima', 6, 168);

    expect(standingLine(board([first]), first)).toBe("You're in first place with 100% accuracy.");
  });

  it('says how much faster to finish when level on score with the player above', () => {
    const above = entry(1, 'Diya', 5, 119);
    const me = entry(2, 'Aarav', 5, 142);

    expect(standingLine(board([above, me]), me)).toBe(
      "You're level with Diya on score. Finish 23 s faster to move up."
    );
  });

  it('explains a tie on score and time instead of asking for a faster time', () => {
    const above = entry(1, 'Diya', 5, 142);
    const me = entry(2, 'Aarav', 5, 142);

    expect(standingLine(board([above, me]), me)).toBe(
      "You're level with Diya on score and time. They finished first, so they rank higher."
    );
  });

  it('counts the players behind and ahead', () => {
    const fatima = entry(1, 'Fatima', 6, 168);
    const diya = entry(2, 'Diya', 4, 119);
    const oliver = entry(3, 'Oliver', 3, 201);
    const leaderboard = board([fatima, diya, oliver]);

    expect(standingLine(leaderboard, diya)).toBe('Ahead of 1 of 2 players with 66.7% accuracy.');
    expect(standingLine(leaderboard, oliver)).toBe('2 players ahead of you. Your score has 50% accuracy.');
  });
});
