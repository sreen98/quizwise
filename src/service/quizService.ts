import type { StoreApi } from 'zustand/vanilla';
import { dataStore, resetDataStore } from '../data/store';
import { parseQuizInput } from '../data/schema';
import type { Attempt, Quiz, QuizData, QuizInput } from '../types/models';
import { finishAttempt, recordAnswer, settleAttempt, toPublicQuestion, toSelection } from './attempts';
import { simulatedDelay } from './latency';
import { rankBestAttempts } from './ranking';
import { getDeadlines } from './timing';
import type {
  AdminQuizItem,
  AttemptResult,
  AttemptResultView,
  CurrentQuestion,
  EndedAttempt,
  Leaderboard,
  LeaderboardEntry,
  QuizDetails,
  QuizListItem,
  StartedAttempt
} from './types';

interface ServiceOptions {
  now?: () => number;
  delay?: () => number;
}

const wait = (milliseconds: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, milliseconds);
  });

const toDetails = (quiz: Quiz): QuizDetails => ({
  id: quiz.id,
  title: quiz.title,
  description: quiz.description,
  countries: quiz.countries,
  questionCount: quiz.questions.length,
  questionTypes: [...new Set(quiz.questions.map(question => question.type))],
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

const toLeaderboardEntry = (attempt: Attempt, index: number, { users, countries }: QuizData): LeaderboardEntry => {
  const user = users.find(item => item.id === attempt.userId);

  return {
    rank: index + 1,
    userId: attempt.userId,
    userName: user?.name ?? 'Unknown user',
    countryName: countries.find(country => country.code === user?.country)?.name ?? '',
    score: attempt.score ?? 0,
    totalQuestions: attempt.totalQuestions,
    percentage: attempt.percentage ?? 0,
    timeTakenSeconds: attempt.timeTakenSeconds ?? 0,
    completedAt: attempt.completedAt
  };
};

const toCurrentQuestion = (attempt: Attempt, quiz: Quiz | undefined): CurrentQuestion => {
  if (attempt.status !== 'in_progress') return { status: attempt.status, endReason: attempt.endReason };

  const question = quiz?.questions[attempt.currentQuestionIndex];
  if (!quiz || !question) throw new Error('Question not found');

  return {
    status: 'in_progress',
    quizTitle: quiz.title,
    question: toPublicQuestion(question),
    index: attempt.currentQuestionIndex,
    total: quiz.questions.length,
    timeLimitSeconds: quiz.timeLimitSeconds,
    perQuestionSeconds: quiz.perQuestionSeconds,
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

export const createQuizService = (
  store: StoreApi<QuizData>,
  { now = () => Date.now(), delay = () => 0 }: ServiceOptions = {}
) => {
  const respond = async <T>(compute: () => T): Promise<T> => {
    const result = structuredClone(compute());
    const milliseconds = delay();
    if (milliseconds > 0) await wait(milliseconds);
    return result;
  };

  const findQuiz = (quizId: string) => {
    const quiz = store.getState().quizzes.find(item => item.id === quizId);
    if (!quiz) throw new Error('Quiz not found');
    return quiz;
  };

  const findAttempt = (attemptId: string, userId?: string) => {
    const attempt = store.getState().attempts.find(item => item.id === attemptId);
    if (!attempt || (userId !== undefined && attempt.userId !== userId)) throw new Error('Attempt not found');
    return attempt;
  };

  const saveAttempt = (attempt: Attempt) => {
    store.setState(state => ({
      attempts: state.attempts.map(item => (item.id === attempt.id ? attempt : item))
    }));
  };

  const loadAttempt = (attemptId: string, time: number, userId?: string) => {
    const stored = findAttempt(attemptId, userId);
    const quiz = store.getState().quizzes.find(item => item.id === stored.quizId);
    const attempt = settleAttempt(stored, quiz, time);
    if (attempt !== stored) saveAttempt(attempt);
    return { attempt, quiz };
  };

  const loadCurrentQuestion = (attemptId: string, questionId: string, time: number, userId?: string) => {
    const { attempt, quiz } = loadAttempt(attemptId, time, userId);
    const question = quiz?.questions[attempt.currentQuestionIndex];
    const isCurrent = attempt.status === 'in_progress' && question?.id === questionId;
    return { attempt, quiz, question: isCurrent ? question : undefined };
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

    getQuizSummary: (quizId: string, userId: string) =>
      respond(() => {
        const quiz = findQuiz(quizId);
        const { users, attempts } = store.getState();
        if (!users.some(user => user.id === userId)) throw new Error('User not found');
        return toListItem(
          quiz,
          attempts.filter(attempt => attempt.quizId === quizId),
          userId
        );
      }),

    getLeaderboard: (quizId: string, limit: number, userId: string) =>
      respond((): Leaderboard => {
        const quiz = findQuiz(quizId);
        const state = store.getState();
        const quizAttempts = state.attempts.filter(attempt => attempt.quizId === quiz.id);
        const entries = rankBestAttempts(quizAttempts).map((attempt, index) =>
          toLeaderboardEntry(attempt, index, state)
        );

        return {
          quizTitle: quiz.title,
          retakesAllowed: quiz.retakesAllowed,
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

    getCurrentQuestion: (attemptId: string, userId?: string) =>
      respond(() => {
        const { attempt, quiz } = loadAttempt(attemptId, now(), userId);
        return toCurrentQuestion(attempt, quiz);
      }),

    submitAnswer: (attemptId: string, questionId: string, optionIds: string[], userId?: string) =>
      respond(() => {
        const time = now();
        const { attempt, quiz, question } = loadCurrentQuestion(attemptId, questionId, time, userId);
        if (!quiz || !question) return toCurrentQuestion(attempt, quiz);

        const answered = recordAnswer(attempt, question, toSelection(question, optionIds), time);
        const next =
          answered.currentQuestionIndex >= quiz.questions.length
            ? finishAttempt(answered, time, 'submitted')
            : answered;
        saveAttempt(next);
        return toCurrentQuestion(next, quiz);
      }),

    saveDraft: (attemptId: string, questionId: string, optionIds: string[], userId?: string) =>
      respond(() => {
        const { attempt, question } = loadCurrentQuestion(attemptId, questionId, now(), userId);
        if (question) saveAttempt({ ...attempt, draftOptionIds: toSelection(question, optionIds) });
      }),

    completeAttempt: (attemptId: string, userId?: string) =>
      respond((): AttemptResult => {
        const time = now();
        const loaded = loadAttempt(attemptId, time, userId).attempt;
        if (loaded.status === 'closed') throw new Error('Attempt was closed');
        const attempt = loaded.status === 'in_progress' ? finishAttempt(loaded, time, 'submitted') : loaded;
        if (attempt !== loaded) saveAttempt(attempt);
        return toResult(attempt);
      }),

    getAttemptResult: (attemptId: string, userId?: string) =>
      respond((): AttemptResultView => {
        const { attempt, quiz } = loadAttempt(attemptId, now(), userId);
        if (attempt.status === 'in_progress') return { status: 'in_progress' };
        if (attempt.status === 'closed' || !quiz) throw new Error('Result not found');
        const { attempts, users } = store.getState();
        const ranked = rankBestAttempts(attempts.filter(item => item.quizId === quiz.id));
        const rankIndex = ranked.findIndex(item => item.userId === attempt.userId);
        const best = ranked[rankIndex];

        return {
          ...toResult(attempt),
          status: 'completed',
          quizTitle: quiz.title,
          userName: users.find(user => user.id === attempt.userId)?.name ?? 'Unknown user',
          retakesAllowed: quiz.retakesAllowed,
          rank: rankIndex === -1 ? null : rankIndex + 1,
          rankedCount: ranked.length,
          best: best ? { score: best.score ?? 0, totalQuestions: best.totalQuestions } : null,
          breakdown:
            quiz.version === attempt.quizVersion
              ? quiz.questions.map(question => ({
                  questionId: question.id,
                  text: question.text,
                  isCorrect: attempt.answers.find(answer => answer.questionId === question.id)?.isCorrect ?? false
                }))
              : null
        };
      }),

    getEndedAttempt: (attemptId: string, userId?: string) =>
      respond((): EndedAttempt => {
        const { attempt, quiz } = loadAttempt(attemptId, now(), userId);
        if (attempt.status === 'in_progress') throw new Error('Attempt is still in progress');
        const userAttempts = store
          .getState()
          .attempts.filter(item => item.quizId === attempt.quizId && item.userId === attempt.userId);
        const [best] = rankBestAttempts(userAttempts);

        return {
          attemptId: attempt.id,
          quizId: attempt.quizId,
          quizTitle: quiz?.title ?? null,
          status: attempt.status,
          endReason: attempt.endReason,
          startedAt: attempt.startedAt,
          timeLimitSeconds: quiz?.timeLimitSeconds ?? null,
          perQuestionSeconds: quiz?.perQuestionSeconds ?? null,
          answeredCount: attempt.answers.filter(answer => answer.selectedOptionIds.length > 0).length,
          totalQuestions: attempt.totalQuestions,
          score: attempt.score,
          percentage: attempt.percentage,
          timeTakenSeconds: attempt.timeTakenSeconds,
          bestResult: best ? { score: best.score ?? 0, totalQuestions: best.totalQuestions } : null,
          canStartAgain: quiz !== undefined && (quiz.retakesAllowed || !best)
        };
      }),

    getUsers: () => respond(() => store.getState().users),

    getCountries: () => respond(() => store.getState().countries),

    resetData: () =>
      respond(() => {
        resetDataStore(store);
      }),

    getAdminQuizzes: () =>
      respond((): AdminQuizItem[] => {
        const { quizzes, attempts } = store.getState();
        const attemptCounts = new Map<string, number>();
        for (const attempt of attempts) {
          attemptCounts.set(attempt.quizId, (attemptCounts.get(attempt.quizId) ?? 0) + 1);
        }
        return quizzes.map(quiz => ({ ...toDetails(quiz), attemptCount: attemptCounts.get(quiz.id) ?? 0 }));
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

export const quizService = createQuizService(dataStore, { delay: simulatedDelay });
