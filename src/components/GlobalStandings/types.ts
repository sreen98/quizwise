import type { GlobalLeaderboardEntry } from '../../service/types';

export interface GlobalStandingsProps {
  entries: GlobalLeaderboardEntry[];
  userId: string;
}
