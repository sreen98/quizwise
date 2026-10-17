import type { AttemptEndReason, AttemptStatus, PublicQuestion } from '../types/models';

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

export interface StartedAttempt {
  attemptId: string;
  resumed: boolean;
}

export interface QuestionInProgress {
  status: 'in_progress';
  question: PublicQuestion;
  index: number;
  total: number;
  overallDeadlineAt: number | null;
  questionDeadlineAt: number | null;
  deadlineAt: number | null;
  draftOptionIds: string[];
}

export interface AttemptFinished {
  status: Exclude<AttemptStatus, 'in_progress'>;
  endReason: AttemptEndReason | null;
}

export type CurrentQuestion = QuestionInProgress | AttemptFinished;
