export type UserRole = 'user' | 'admin';
export type QuestionType = 'single' | 'multiple';
export type AttemptStatus = 'in_progress' | 'completed' | 'closed';
export type AttemptEndReason = 'submitted' | 'timeout' | 'quiz_changed' | 'quiz_deleted';

export interface Country {
  code: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  country: string;
  role: UserRole;
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: Option[];
  correctOptionIds: string[];
}

export type PublicQuestion = Omit<Question, 'correctOptionIds'>;

export interface Quiz {
  id: string;
  title: string;
  description: string;
  countries: string[];
  timeLimitSeconds: number | null;
  perQuestionSeconds: number | null;
  retakesAllowed: boolean;
  version: number;
  questions: Question[];
}

export interface Answer {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
  answeredAt: string;
}

export interface Attempt {
  id: string;
  quizId: string;
  userId: string;
  quizVersion: number;
  status: AttemptStatus;
  endReason: AttemptEndReason | null;
  startedAt: string;
  currentQuestionIndex: number;
  answers: Answer[];
  draftOptionIds: string[];
  completedAt: string | null;
  score: number | null;
  totalQuestions: number;
  percentage: number | null;
  timeTakenSeconds: number | null;
}

export interface QuizData {
  countries: Country[];
  users: User[];
  quizzes: Quiz[];
  attempts: Attempt[];
}
