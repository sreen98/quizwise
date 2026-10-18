import type { AttemptEndReason, AttemptStatus, PublicQuestion, QuestionType } from '../types/models';

export interface QuizDetails {
  id: string;
  title: string;
  description: string;
  countries: string[];
  questionCount: number;
  questionTypes: QuestionType[];
  timeLimitSeconds: number | null;
  perQuestionSeconds: number | null;
  retakesAllowed: boolean;
}

export interface AdminQuizItem extends QuizDetails {
  attemptCount: number;
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
  country: string;
  countryName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  completedAt: string | null;
}

export interface Leaderboard {
  quizTitle: string;
  retakesAllowed: boolean;
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
  quizTitle: string;
  question: PublicQuestion;
  index: number;
  answered: boolean[];
  total: number;
  timeLimitSeconds: number | null;
  perQuestionSeconds: number | null;
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

export interface AttemptResult {
  attemptId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  percentage: number;
  timeTakenSeconds: number;
  endReason: AttemptEndReason | null;
  completedAt: string | null;
}

export interface EndedAttempt {
  attemptId: string;
  quizId: string;
  quizTitle: string | null;
  status: Exclude<AttemptStatus, 'in_progress'>;
  endReason: AttemptEndReason | null;
  startedAt: string;
  timeLimitSeconds: number | null;
  perQuestionSeconds: number | null;
  answeredCount: number;
  totalQuestions: number;
  score: number | null;
  percentage: number | null;
  timeTakenSeconds: number | null;
  bestResult: { score: number; totalQuestions: number } | null;
  canStartAgain: boolean;
}

export interface QuestionOutcome {
  questionId: string;
  text: string;
  isCorrect: boolean;
}

export interface ResultDetails extends AttemptResult {
  status: 'completed';
  quizTitle: string;
  userName: string;
  retakesAllowed: boolean;
  rank: number | null;
  rankedCount: number;
  best: { score: number; totalQuestions: number } | null;
  breakdown: QuestionOutcome[] | null;
}

export type AttemptResultView = ResultDetails | { status: 'in_progress' };

export type ImportResult = { isImported: true; title: string } | { isImported: false; problems: string[] };
