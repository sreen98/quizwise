import { formatSeconds } from '../../format';
import type { Leaderboard, LeaderboardEntry } from '../../service/types';

const playerCount = (count: number) => `${String(count)} ${count === 1 ? 'player' : 'players'}`;

const tieHint = (leaderboard: Leaderboard, me: LeaderboardEntry) => {
  const above = leaderboard.entries.find(entry => entry.rank === me.rank - 1);
  if (above?.score !== me.score) return null;
  if (above.timeTakenSeconds === me.timeTakenSeconds) {
    return `You're level with ${above.userName} on score and time. They finished first, so they rank higher.`;
  }
  return `You're level with ${above.userName} on score. Finish ${formatSeconds(me.timeTakenSeconds - above.timeTakenSeconds)} faster to move up.`;
};

export const standingLine = (leaderboard: Leaderboard, me: LeaderboardEntry) => {
  const accuracy = `${String(me.percentage)}% accuracy`;
  const others = leaderboard.rankedCount - 1;
  const behind = leaderboard.rankedCount - me.rank;
  if (me.rank === 1) return `You're in first place with ${accuracy}.`;
  const hint = tieHint(leaderboard, me);
  if (hint) return hint;
  if (behind === 0) return `${playerCount(others)} ahead of you. Your score has ${accuracy}.`;
  return `Ahead of ${String(behind)} of ${playerCount(others)} with ${accuracy}.`;
};
