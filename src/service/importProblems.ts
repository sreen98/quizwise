import type { z } from 'zod';

const MAX_PROBLEMS = 5;

const fieldLabels: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  countries: 'Available in',
  timeLimitSeconds: 'Time limit for the whole quiz',
  perQuestionSeconds: 'Time limit for each question',
  retakesAllowed: 'Allow retakes',
  questions: 'Questions'
};

const questionLabels: Record<string, string> = {
  text: 'text',
  type: 'answer type',
  options: 'options',
  correctOptionIds: 'correct answers'
};

const placeOf = (path: PropertyKey[]) => {
  const [field, questionIndex, part, optionIndex] = path;
  if (field === 'questions' && typeof questionIndex === 'number') {
    const question = `Question ${String(questionIndex + 1)}`;
    if (part === 'options' && typeof optionIndex === 'number') return `${question}, option ${String(optionIndex + 1)}`;
    return typeof part === 'string' ? `${question}, ${questionLabels[part] ?? part}` : question;
  }
  return typeof field === 'string' ? (fieldLabels[field] ?? field) : null;
};

const describeIssue = (issue: z.core.$ZodIssue) => {
  const place = placeOf(issue.path);
  const message = issue.code === 'invalid_type' ? 'Missing or not the right kind of value' : issue.message;
  return place ? `${place}: ${message}` : "This file doesn't contain a quiz.";
};

export const describeProblems = (issues: z.core.$ZodIssue[]) => {
  const problems = [...new Set(issues.map(describeIssue))];
  if (problems.length <= MAX_PROBLEMS) return problems;
  return [...problems.slice(0, MAX_PROBLEMS), `And ${String(problems.length - MAX_PROBLEMS)} more problems.`];
};
