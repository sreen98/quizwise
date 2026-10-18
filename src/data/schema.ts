import { z } from 'zod';
import type { QuizData, QuizInput } from '../types/models';

const id = z.string().min(1);
const seconds = z
  .number({ message: 'Enter a whole number above 0' })
  .int('Enter a whole number above 0')
  .positive('Enter a whole number above 0')
  .nullable();
const timestamp = z.iso.datetime();

const hasDuplicates = (values: string[]) => new Set(values).size !== values.length;

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

    if (optionIds.size !== question.options.length) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Each option needs its own id' });
    }
    if (hasDuplicates(question.correctOptionIds)) {
      ctx.addIssue({ code: 'custom', path: ['correctOptionIds'], message: 'A correct option is listed twice' });
    }
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

const quizFields = z.object({
  id,
  title: z.string().trim().min(1, 'Enter a title'),
  description: z.string().trim(),
  countries: z
    .array(z.string().min(1))
    .min(1, 'Pick at least one country')
    .refine(codes => !hasDuplicates(codes), 'Each country can only be picked once'),
  timeLimitSeconds: seconds,
  perQuestionSeconds: seconds,
  retakesAllowed: z.boolean(),
  version: z.number().int().positive().default(1),
  questions: z.array(questionSchema).min(1, 'Add at least one question')
});

const checkQuestionIds = (quiz: { questions: { id: string }[] }, ctx: z.RefinementCtx) => {
  if (hasDuplicates(quiz.questions.map(question => question.id))) {
    ctx.addIssue({ code: 'custom', path: ['questions'], message: 'Each question needs its own id' });
  }
};

export const quizSchema = quizFields.superRefine(checkQuestionIds);

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
  endReason: z.enum(['submitted', 'timeout', 'quiz_changed', 'quiz_deleted']).nullable().default(null),
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

const MAX_TITLE = 120;
const MAX_DESCRIPTION = 500;
const MAX_QUESTION = 500;
const MAX_OPTION = 200;

const checkTextLengths = (quiz: QuizInput, ctx: z.RefinementCtx) => {
  const tooLong = (text: string, max: number, path: (string | number)[], what: string) => {
    if (text.length > max)
      ctx.addIssue({ code: 'custom', path, message: `Keep the ${what} under ${String(max)} characters` });
  };

  tooLong(quiz.title, MAX_TITLE, ['title'], 'title');
  tooLong(quiz.description, MAX_DESCRIPTION, ['description'], 'description');
  quiz.questions.forEach((question, questionIndex) => {
    tooLong(question.text, MAX_QUESTION, ['questions', questionIndex, 'text'], 'question');
    question.options.forEach((option, optionIndex) => {
      tooLong(option.text, MAX_OPTION, ['questions', questionIndex, 'options', optionIndex, 'text'], 'option');
    });
  });
};

export const quizInputSchema = quizFields
  .omit({ id: true, version: true })
  .superRefine(checkQuestionIds)
  .superRefine(checkTextLengths);

export const parseQuizInput = (data: unknown): QuizInput => {
  const result = quizInputSchema.safeParse(data);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? 'Invalid quiz');
  return result.data;
};

export const readQuizData = (json: unknown): QuizData | null => {
  const result = quizDataSchema.safeParse(json);
  return result.success ? result.data : null;
};
