import type { Attempt } from '../types/models';

const byBestResult = (a: Attempt, b: Attempt) =>
  (b.score ?? 0) - (a.score ?? 0) ||
  (a.timeTakenSeconds ?? 0) - (b.timeTakenSeconds ?? 0) ||
  (a.completedAt ?? '').localeCompare(b.completedAt ?? '');

export const rankBestAttempts = (attempts: Attempt[]): Attempt[] => {
  const bestByUser = new Map<string, Attempt>();

  for (const attempt of attempts) {
    if (attempt.status !== 'completed') continue;
    const current = bestByUser.get(attempt.userId);
    if (!current || byBestResult(attempt, current) < 0) {
      bestByUser.set(attempt.userId, attempt);
    }
  }

  return [...bestByUser.values()].sort(byBestResult);
};
