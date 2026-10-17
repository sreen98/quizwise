import { z } from 'zod';
import type { QuizData } from '../types/models';

const id = z.string().min(1);
const seconds = z.number().int().positive().nullable();
const timestamp = z.iso.datetime();

const optionSchema = z.object({
  id,
  text: z.string().trim().min(1, 'Enter the option text')
});

const questionSchema = z
  .object({
    id,
    text: z.string().trim().min(1, 'Enter the question text'),
    type: z.enum(['single', 'multiple']),
    options: z.array(optionSchema).min(2, 'Add at least two options'),
    correctOptionIds: z.array(id)
  })
  .superRefine((question, ctx) => {
    const optionIds = new Set(question.options.map(option => option.id));
    const correctCount = question.correctOptionIds.length;

    if (question.correctOptionIds.some(optionId => !optionIds.has(optionId))) {
      ctx.addIssue({
        code: 'custom',
        path: ['correctOptionIds'],
        message: 'A correct answer points to a missing option'
      });
    }
    if (correctCount === 0) {
      ctx.addIssue({ code: 'custom', path: ['correctOptionIds'], message: 'Mark at least one correct option' });
    }
    if (question.type === 'single' && correctCount > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['correctOptionIds'],
        message: 'A single choice question needs exactly one correct option'
      });
    }
  });

export const quizSchema = z.object({
  id,
  title: z.string().trim().min(1, 'Enter a title'),
  description: z.string().trim(),
  countries: z.array(z.string().min(1)).min(1, 'Pick at least one country'),
  timeLimitSeconds: seconds,
  perQuestionSeconds: seconds,
  retakesAllowed: z.boolean(),
  version: z.number().int().positive().default(1),
  questions: z.array(questionSchema).min(1, 'Add at least one question')
});

const answerSchema = z.object({
  questionId: id,
  selectedOptionIds: z.array(id),
  isCorrect: z.boolean(),
  answeredAt: timestamp
});

const attemptSchema = z.object({
  id,
  quizId: id,
  userId: id,
  quizVersion: z.number().int().positive().default(1),
  status: z.enum(['in_progress', 'completed', 'closed']),
  endReason: z.enum(['submitted', 'timeout', 'quiz_changed']).nullable().default(null),
  startedAt: timestamp,
  currentQuestionIndex: z.number().int().nonnegative(),
  answers: z.array(answerSchema),
  draftOptionIds: z.array(id).default([]),
  completedAt: timestamp.nullable(),
  score: z.number().int().nonnegative().nullable(),
  totalQuestions: z.number().int().positive(),
  percentage: z.number().min(0).max(100).nullable(),
  timeTakenSeconds: z.number().nonnegative().nullable()
});

const quizDataSchema = z.object({
  countries: z.array(z.object({ code: z.string().min(1), name: z.string().min(1) })),
  users: z.array(
    z.object({ id, name: z.string().min(1), country: z.string().min(1), role: z.enum(['user', 'admin']) })
  ),
  quizzes: z.array(quizSchema),
  attempts: z.array(attemptSchema)
});

export const parseQuizData = (json: unknown): QuizData => quizDataSchema.parse(json);
