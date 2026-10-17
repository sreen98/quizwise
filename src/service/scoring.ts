import type { Answer, Question } from '../types/models';

export interface AttemptSummary {
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  percentage: number;
}

export const isAnswerCorrect = (question: Question, selectedOptionIds: string[]): boolean => {
  const selected = new Set(selectedOptionIds);

  return (
    selected.size === question.correctOptionIds.length &&
    question.correctOptionIds.every(optionId => selected.has(optionId))
  );
};

export const summariseAttempt = (answers: Answer[], totalQuestions: number): AttemptSummary => {
  const correctCount = answers.filter(answer => answer.isCorrect).length;

  return {
    score: correctCount,
    totalQuestions,
    correctCount,
    incorrectCount: totalQuestions - correctCount,
    percentage: Math.round((correctCount / totalQuestions) * 1000) / 10
  };
};
