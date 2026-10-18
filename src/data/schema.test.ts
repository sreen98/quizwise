import { describe, expect, it } from 'vitest';
import { parseQuizData, quizInputSchema, quizSchema } from './schema';
import seed from './seed.json';

const validQuiz = {
  id: 'quiz-1',
  title: 'Capitals',
  description: '',
  countries: ['IN'],
  timeLimitSeconds: 60,
  perQuestionSeconds: null,
  retakesAllowed: true,
  questions: [
    {
      id: 'question-1',
      text: 'Capital of France?',
      type: 'single',
      options: [
        { id: 'a', text: 'Paris' },
        { id: 'b', text: 'Rome' }
      ],
      correctOptionIds: ['a']
    }
  ]
};

const messagesFor = (quiz: unknown) => {
  const result = quizSchema.safeParse(quiz);
  return result.success ? [] : result.error.issues.map(issue => issue.message);
};

const withQuestion = (changes: object) => ({
  ...validQuiz,
  questions: [{ ...validQuiz.questions[0], ...changes }]
});

describe('parseQuizData', () => {
  it('accepts the seed data', () => {
    const data = parseQuizData(seed);

    expect(data.users).toHaveLength(5);
    expect(data.quizzes).toHaveLength(5);
    expect(data.attempts).toHaveLength(11);
  });

  it('fills in the fields the seed does not have', () => {
    const data = parseQuizData(seed);
    const quiz = data.quizzes.find(item => item.id === 'q1');
    const attempt = data.attempts.find(item => item.id === 'a11');

    expect(quiz?.version).toBe(1);
    expect(attempt).toMatchObject({ quizVersion: 1, draftOptionIds: [], endReason: null, status: 'in_progress' });
  });

  it('rejects data with a broken quiz', () => {
    const broken = { ...seed, quizzes: [{ ...seed.quizzes[0], questions: [] }] };

    expect(() => parseQuizData(broken)).toThrow();
  });
});

describe('quizSchema', () => {
  it('accepts a valid quiz', () => {
    expect(messagesFor(validQuiz)).toEqual([]);
  });

  it('requires a title', () => {
    expect(messagesFor({ ...validQuiz, title: '   ' })).toContain('Enter a title');
  });

  it('requires at least one question', () => {
    expect(messagesFor({ ...validQuiz, questions: [] })).toContain('Add at least one question');
  });

  it('requires at least two options per question', () => {
    const quiz = withQuestion({ options: [{ id: 'a', text: 'Paris' }] });

    expect(messagesFor(quiz)).toContain('Add at least two options');
  });

  it('requires at least one correct option', () => {
    expect(messagesFor(withQuestion({ correctOptionIds: [] }))).toContain('Mark at least one correct option');
  });

  it('allows only one correct option for single choice', () => {
    expect(messagesFor(withQuestion({ correctOptionIds: ['a', 'b'] }))).toContain(
      'A single choice question needs exactly one correct option'
    );
  });

  it('allows several correct options for multiple choice', () => {
    expect(messagesFor(withQuestion({ type: 'multiple', correctOptionIds: ['a', 'b'] }))).toEqual([]);
  });

  it('rejects two options with the same id', () => {
    const quiz = withQuestion({
      options: [
        { id: 'a', text: 'Paris' },
        { id: 'a', text: 'Rome' }
      ]
    });

    expect(messagesFor(quiz)).toContain('Each option needs its own id');
  });

  it('rejects a correct option listed twice', () => {
    expect(messagesFor(withQuestion({ type: 'multiple', correctOptionIds: ['a', 'a'] }))).toContain(
      'A correct option is listed twice'
    );
  });

  it('rejects two questions with the same id', () => {
    const quiz = { ...validQuiz, questions: [validQuiz.questions[0], validQuiz.questions[0]] };

    expect(messagesFor(quiz)).toContain('Each question needs its own id');
  });

  it('rejects a correct answer that is not one of the options', () => {
    expect(messagesFor(withQuestion({ correctOptionIds: ['z'] }))).toContain(
      'A correct answer points to a missing option'
    );
  });
});

describe('quizInputSchema', () => {
  const inputMessages = (quiz: unknown) => {
    const result = quizInputSchema.safeParse(quiz);
    return result.success ? [] : result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
  };

  it('accepts text within the length limits', () => {
    expect(inputMessages(validQuiz)).toEqual([]);
  });

  it('rejects a title, question or option that is too long', () => {
    const quiz = {
      ...withQuestion({
        text: 'q'.repeat(501),
        options: [
          { id: 'a', text: 'o'.repeat(201) },
          { id: 'b', text: 'Rome' }
        ]
      }),
      title: 'a'.repeat(121)
    };

    expect(inputMessages(quiz)).toEqual([
      'title: Keep the title under 120 characters',
      'questions.0.text: Keep the question under 500 characters',
      'questions.0.options.0.text: Keep the option under 200 characters'
    ]);
  });

  it('keeps accepting long text in stored quizzes', () => {
    expect(messagesFor({ ...validQuiz, title: 'a'.repeat(121) })).toEqual([]);
  });
});
