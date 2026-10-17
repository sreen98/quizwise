import type { Attempt, AttemptEndReason, PublicQuestion, Question, Quiz } from '../types/models';
import { isAnswerCorrect, summariseAttempt } from './scoring';
import { getDeadlines } from './timing';

const toIso = (time: number) => new Date(time).toISOString();

export const toPublicQuestion = ({ id, text, type, options }: Question): PublicQuestion => ({
  id,
  text,
  type,
  options
});

export const recordAnswer = (
  attempt: Attempt,
  question: Question,
  selectedOptionIds: string[],
  answeredAt: number
): Attempt => ({
  ...attempt,
  answers: [
    ...attempt.answers,
    {
      questionId: question.id,
      selectedOptionIds,
      isCorrect: isAnswerCorrect(question, selectedOptionIds),
      answeredAt: toIso(answeredAt)
    }
  ],
  currentQuestionIndex: attempt.currentQuestionIndex + 1,
  draftOptionIds: []
});

export const finishAttempt = (attempt: Attempt, completedAt: number, endReason: AttemptEndReason): Attempt => {
  const summary = summariseAttempt(attempt.answers, attempt.totalQuestions);

  return {
    ...attempt,
    status: 'completed',
    endReason,
    completedAt: toIso(completedAt),
    score: summary.score,
    percentage: summary.percentage,
    timeTakenSeconds: Math.round((completedAt - Date.parse(attempt.startedAt)) / 1000)
  };
};

export const catchUp = (attempt: Attempt, quiz: Quiz, now: number): Attempt => {
  let current = attempt;

  while (current.status === 'in_progress') {
    const { overallDeadlineAt, deadlineAt } = getDeadlines(quiz, current);
    if (deadlineAt === null || now < deadlineAt) return current;

    const question = quiz.questions[current.currentQuestionIndex];
    if (question) {
      current = recordAnswer(current, question, current.draftOptionIds, deadlineAt);
    }

    const overallTimeUp = deadlineAt === overallDeadlineAt;
    const noQuestionsLeft = current.currentQuestionIndex >= quiz.questions.length;
    if (overallTimeUp || noQuestionsLeft) {
      current = finishAttempt(current, deadlineAt, 'timeout');
    }
  }

  return current;
};
