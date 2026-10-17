import type { StoreApi } from 'zustand/vanilla';
import { dataStore } from '../data/store';
import { parseQuizInput } from '../data/schema';
import type { Attempt, Quiz, QuizData, QuizInput, User } from '../types/models';
import { finishAttempt, recordAnswer, settleAttempt, toPublicQuestion } from './attempts';
import { rankBestAttempts } from './ranking';
import { getDeadlines } from './timing';
import type {
  AttemptResult,
  CurrentQuestion,
  Leaderboard,
  LeaderboardEntry,
  QuizDetails,
  QuizListItem,
  StartedAttempt
} from './types';

const respond = <T>(compute: () => T): Promise<T> =>
  new Promise(resolve => {
    resolve(compute());
  });

const toDetails = (quiz: Quiz): QuizDetails => ({
  id: quiz.id,
  title: quiz.title,
  description: quiz.description,
  countries: quiz.countries,
  questionCount: quiz.questions.length,
  timeLimitSeconds: quiz.timeLimitSeconds,
  perQuestionSeconds: quiz.perQuestionSeconds,
  retakesAllowed: quiz.retakesAllowed
});

const toListItem = (quiz: Quiz, quizAttempts: Attempt[], userId: string): QuizListItem => {
  const userAttempts = quizAttempts.filter(attempt => attempt.userId === userId);
  const [best] = rankBestAttempts(userAttempts);
  const inProgress = userAttempts.find(attempt => attempt.status === 'in_progress');
  const ranked = rankBestAttempts(quizAttempts);
  const rankIndex = ranked.findIndex(attempt => attempt.userId === userId);

  return {
    ...toDetails(quiz),
    completed: Boolean(best),
    bestScore: best?.score ?? null,
    bestPercentage: best?.percentage ?? null,
    bestAttemptId: best?.id ?? null,
    inProgress: inProgress
      ? { attemptId: inProgress.id, answeredCount: inProgress.answers.length, startedAt: inProgress.startedAt }
      : null,
    rank: rankIndex === -1 ? null : rankIndex + 1,
    rankedCount: ranked.length
  };
};

const toLeaderboardEntry = (attempt: Attempt, index: number, users: User[]): LeaderboardEntry => ({
  rank: index + 1,
  userId: attempt.userId,
  userName: users.find(user => user.id === attempt.userId)?.name ?? 'Unknown user',
  score: attempt.score ?? 0,
  totalQuestions: attempt.totalQuestions,
  percentage: attempt.percentage ?? 0,
  timeTakenSeconds: attempt.timeTakenSeconds ?? 0
});

const toCurrentQuestion = (attempt: Attempt, quiz: Quiz | undefined): CurrentQuestion => {
  if (attempt.status !== 'in_progress') return { status: attempt.status, endReason: attempt.endReason };

  const question = quiz?.questions[attempt.currentQuestionIndex];
  if (!quiz || !question) throw new Error('Question not found');

  return {
    status: 'in_progress',
    question: toPublicQuestion(question),
    index: attempt.currentQuestionIndex,
    total: quiz.questions.length,
    ...getDeadlines(quiz, attempt),
    draftOptionIds: attempt.draftOptionIds
  };
};

const toResult = (attempt: Attempt): AttemptResult => {
  const score = attempt.score ?? 0;

  return {
    attemptId: attempt.id,
    quizId: attempt.quizId,
    score,
    totalQuestions: attempt.totalQuestions,
    correctCount: score,
    incorrectCount: attempt.totalQuestions - score,
    percentage: attempt.percentage ?? 0,
    timeTakenSeconds: attempt.timeTakenSeconds ?? 0,
    endReason: attempt.endReason,
    completedAt: attempt.completedAt
  };
};

export const createQuizService = (store: StoreApi<QuizData>, now: () => number = Date.now) => {
  const findQuiz = (quizId: string) => {
    const quiz = store.getState().quizzes.find(item => item.id === quizId);
    if (!quiz) throw new Error('Quiz not found');
    return quiz;
  };

  const findAttempt = (attemptId: string) => {
    const attempt = store.getState().attempts.find(item => item.id === attemptId);
    if (!attempt) throw new Error('Attempt not found');
    return attempt;
  };

  const saveAttempt = (attempt: Attempt) => {
    store.setState(state => ({
      attempts: state.attempts.map(item => (item.id === attempt.id ? attempt : item))
    }));
  };

  const loadAttempt = (attemptId: string) => {
    const stored = findAttempt(attemptId);
    const quiz = store.getState().quizzes.find(item => item.id === stored.quizId);
    const attempt = settleAttempt(stored, quiz, now());
    if (attempt !== stored) saveAttempt(attempt);
    return { attempt, quiz };
  };

  return {
    getQuizzes: (userId: string, country?: string) =>
      respond(() => {
        const { users, quizzes, attempts } = store.getState();
        const user = users.find(item => item.id === userId);
        if (!user) throw new Error('User not found');

        const countryCode = country ?? user.country;

        return quizzes
          .filter(quiz => countryCode === 'all' || quiz.countries.includes(countryCode))
          .map(quiz =>
            toListItem(
              quiz,
              attempts.filter(attempt => attempt.quizId === quiz.id),
              userId
            )
          );
      }),

    getQuiz: (quizId: string) => respond(() => toDetails(findQuiz(quizId))),

    getLeaderboard: (quizId: string, limit: number, userId: string) =>
      respond((): Leaderboard => {
        const quiz = findQuiz(quizId);
        const { users, attempts } = store.getState();
        const entries = rankBestAttempts(attempts.filter(attempt => attempt.quizId === quiz.id)).map((attempt, index) =>
          toLeaderboardEntry(attempt, index, users)
        );

        return {
          entries: entries.slice(0, limit),
          currentUser: entries.find(entry => entry.userId === userId) ?? null,
          rankedCount: entries.length
        };
      }),

    startOrResumeAttempt: (quizId: string, userId: string) =>
      respond((): StartedAttempt => {
        const quiz = findQuiz(quizId);
        const { users, attempts } = store.getState();
        if (!users.some(user => user.id === userId)) throw new Error('User not found');

        const userAttempts = attempts.filter(attempt => attempt.quizId === quizId && attempt.userId === userId);
        const open = userAttempts.find(attempt => attempt.status === 'in_progress');
        if (open) return { attemptId: open.id, resumed: true };

        if (!quiz.retakesAllowed && userAttempts.some(attempt => attempt.status === 'completed')) {
          throw new Error('Retakes are not allowed');
        }

        const attempt: Attempt = {
          id: crypto.randomUUID(),
          quizId,
          userId,
          quizVersion: quiz.version,
          status: 'in_progress',
          endReason: null,
          startedAt: new Date(now()).toISOString(),
          currentQuestionIndex: 0,
          answers: [],
          draftOptionIds: [],
          completedAt: null,
          score: null,
          totalQuestions: quiz.questions.length,
          percentage: null,
          timeTakenSeconds: null
        };
        store.setState(state => ({ attempts: [...state.attempts, attempt] }));
        return { attemptId: attempt.id, resumed: false };
      }),

    getCurrentQuestion: (attemptId: string) =>
      respond(() => {
        const { attempt, quiz } = loadAttempt(attemptId);
        return toCurrentQuestion(attempt, quiz);
      }),

    submitAnswer: (attemptId: string, questionId: string, optionIds: string[]) =>
      respond(() => {
        const { attempt, quiz } = loadAttempt(attemptId);
        const question = quiz?.questions[attempt.currentQuestionIndex];
        if (attempt.status !== 'in_progress' || !quiz || !question || question.id !== questionId) {
          return toCurrentQuestion(attempt, quiz);
        }

        const optionIdsInQuestion = new Set(question.options.map(option => option.id));
        if (!optionIds.every(optionId => optionIdsInQuestion.has(optionId))) throw new Error('Invalid answer');

        const answered = recordAnswer(attempt, question, optionIds, now());
        const next =
          answered.currentQuestionIndex >= quiz.questions.length
            ? finishAttempt(answered, now(), 'submitted')
            : answered;
        saveAttempt(next);
        return toCurrentQuestion(next, quiz);
      }),

    saveDraft: (attemptId: string, optionIds: string[]) =>
      respond(() => {
        const { attempt } = loadAttempt(attemptId);
        if (attempt.status === 'in_progress') saveAttempt({ ...attempt, draftOptionIds: optionIds });
      }),

    completeAttempt: (attemptId: string) =>
      respond((): AttemptResult => {
        const loaded = loadAttempt(attemptId).attempt;
        if (loaded.status === 'closed') throw new Error('Attempt was closed');
        const attempt = loaded.status === 'in_progress' ? finishAttempt(loaded, now(), 'submitted') : loaded;
        if (attempt !== loaded) saveAttempt(attempt);
        return toResult(attempt);
      }),

    getQuizForEdit: (quizId: string) => respond(() => findQuiz(quizId)),

    createQuiz: (data: QuizInput) =>
      respond((): Quiz => {
        const quiz: Quiz = { ...parseQuizInput(data), id: crypto.randomUUID(), version: 1 };
        store.setState(state => ({ quizzes: [...state.quizzes, quiz] }));
        return quiz;
      }),

    updateQuiz: (quizId: string, data: QuizInput) =>
      respond((): Quiz => {
        const existing = findQuiz(quizId);
        const quiz: Quiz = { ...parseQuizInput(data), id: existing.id, version: existing.version + 1 };
        store.setState(state => ({ quizzes: state.quizzes.map(item => (item.id === quizId ? quiz : item)) }));
        return quiz;
      }),

    deleteQuiz: (quizId: string) =>
      respond(() => {
        findQuiz(quizId);
        store.setState(state => ({
          quizzes: state.quizzes.filter(quiz => quiz.id !== quizId),
          attempts: state.attempts.filter(attempt => attempt.quizId !== quizId || attempt.status === 'in_progress')
        }));
      }),

    subscribe: (listener: () => void) => store.subscribe(listener)
  };
};

export const quizService = createQuizService(dataStore);
