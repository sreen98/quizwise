import type { LeaderboardEntry } from '../../service/types';

export interface PodiumCardProps {
  entry: LeaderboardEntry;
  isMe: boolean;
}
