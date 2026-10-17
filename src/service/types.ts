export interface QuizDetails {
  id: string;
  title: string;
  description: string;
  countries: string[];
  questionCount: number;
  timeLimitSeconds: number | null;
  perQuestionSeconds: number | null;
  retakesAllowed: boolean;
}

export interface InProgressSummary {
  attemptId: string;
  answeredCount: number;
  startedAt: string;
}

export interface QuizListItem extends QuizDetails {
  completed: boolean;
  bestScore: number | null;
  bestPercentage: number | null;
  bestAttemptId: string | null;
  inProgress: InProgressSummary | null;
  rank: number | null;
  rankedCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
}

export interface Leaderboard {
  entries: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
  rankedCount: number;
}
