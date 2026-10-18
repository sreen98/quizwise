import type { QuizInput } from '../../types/models';

export const exampleQuiz: QuizInput = {
  title: 'Space Basics',
  description: 'A short quiz about the solar system.',
  countries: ['IN', 'GB'],
  timeLimitSeconds: 300,
  perQuestionSeconds: null,
  retakesAllowed: true,
  questions: [
    {
      id: 'q1',
      text: 'Which planet is closest to the Sun?',
      type: 'single',
      options: [
        { id: 'q1-a', text: 'Venus' },
        { id: 'q1-b', text: 'Mercury' },
        { id: 'q1-c', text: 'Mars' }
      ],
      correctOptionIds: ['q1-b']
    },
    {
      id: 'q2',
      text: 'Which of these are gas giants?',
      type: 'multiple',
      options: [
        { id: 'q2-a', text: 'Jupiter' },
        { id: 'q2-b', text: 'Earth' },
        { id: 'q2-c', text: 'Saturn' }
      ],
      correctOptionIds: ['q2-a', 'q2-c']
    }
  ]
};

export const fieldNotes = [
  { field: 'title', note: 'text, required' },
  { field: 'description', note: 'text, can be empty' },
  { field: 'countries', note: 'country codes, at least one, for example "IN"' },
  { field: 'timeLimitSeconds', note: 'whole seconds for the whole quiz, or null' },
  { field: 'perQuestionSeconds', note: 'whole seconds for each question, or null' },
  { field: 'retakesAllowed', note: 'true or false' },
  {
    field: 'questions',
    note: 'at least one, each with an id, text, type ("single" or "multiple"), two or more options and the ids of the correct options'
  }
];
