export interface InProgressSummary {
  attemptId: string;
  answeredCount: number;
  startedAt: string;
}

export interface QuizListItem {
  id: string;
  title: string;
  description: string;
  countries: string[];
  questionCount: number;
  timeLimitSeconds: number | null;
  perQuestionSeconds: number | null;
  retakesAllowed: boolean;
  completed: boolean;
  bestScore: number | null;
  bestPercentage: number | null;
  bestAttemptId: string | null;
  inProgress: InProgressSummary | null;
}
