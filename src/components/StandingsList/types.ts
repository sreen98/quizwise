import type { LeaderboardEntry } from '../../service/types';

export interface StandingsListProps {
  quizTitle: string;
  entries: LeaderboardEntry[];
  userId: string;
}
