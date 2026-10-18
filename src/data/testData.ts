import type { Attempt, Question, Quiz, QuizData, User } from '../types/models';

const TOPICS = [
  'Algebra',
  'Astronomy',
  'Biology',
  'Chemistry',
  'Cricket',
  'Climate',
  'Computers',
  'Cooking',
  'Dinosaurs',
  'Economics',
  'Films',
  'Flags',
  'Football',
  'Geometry',
  'Grammar',
  'Health',
  'Indian History',
  'Inventions',
  'Languages',
  'Literature',
  'Mammals',
  'Maps',
  'Music',
  'Mythology',
  'Nutrition',
  'Oceans',
  'Olympics',
  'Painting',
  'Physics',
  'Planets',
  'Poetry',
  'Rivers',
  'Robotics',
  'Space Travel',
  'Spices',
  'Sports Rules',
  'Statistics',
  'Trees',
  'UK History',
  'UAE Landmarks',
  'Volcanoes',
  'Weather',
  'World Capitals',
  'World Religions',
  'Zoology'
];

const FIRST_NAMES = [
  'Aisha',
  'Rahul',
  'Emma',
  'Omar',
  'Priya',
  'James',
  'Layla',
  'Arjun',
  'Sophie',
  'Yusuf',
  'Meera',
  'Liam',
  'Noor',
  'Kiran',
  'Grace'
];
const LAST_NAMES = ['Khan', 'Patel', 'Brown'];
const COUNTRY_SETS = [['IN'], ['AE'], ['GB'], ['IN', 'AE'], ['IN', 'GB'], ['AE', 'GB'], ['IN', 'AE', 'GB']];
const USER_COUNTRIES = ['IN', 'AE', 'GB'];
const DAY_MS = 24 * 60 * 60 * 1000;

const createRandom = (seed: number) => {
  let state = seed;
  return (max: number) => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state % max;
  };
};

const pick = <T>(items: T[], index: number) => items[index % items.length] as T;

const makeQuestion = (quizId: string, topic: string, number: number, random: (max: number) => number): Question => {
  const id = `${quizId}-${String(number)}`;
  const options = ['A', 'B', 'C', 'D'].map(letter => ({ id: `${id}-${letter}`, text: `${topic} answer ${letter}` }));
  const isMultiple = random(4) === 0;
  const first = pick(options, random(4)).id;
  const second = pick(options, random(4)).id;
  const correctOptionIds = isMultiple && first !== second ? [first, second] : [first];
  return {
    id,
    text: `${topic} question ${String(number)}: which answer is right?`,
    type: correctOptionIds.length > 1 ? 'multiple' : 'single',
    options,
    correctOptionIds
  };
};

const makeQuiz = (topic: string, index: number, random: (max: number) => number): Quiz => {
  const id = `t-q${String(index + 1)}`;
  const questionCount = 3 + random(4);
  return {
    id,
    title: `${topic} Quiz`,
    description: `Practice questions about ${topic.toLowerCase()}.`,
    countries: pick(COUNTRY_SETS, index),
    timeLimitSeconds: index % 3 === 0 ? null : 60 * (2 + random(5)),
    perQuestionSeconds: index % 4 === 0 ? 30 : null,
    retakesAllowed: index % 5 !== 0,
    version: 1,
    questions: Array.from({ length: questionCount }, (_, number) => makeQuestion(id, topic, number + 1, random))
  };
};

const makeAttempt = (quiz: Quiz, user: User, id: string, now: number, random: (max: number) => number): Attempt => {
  const total = quiz.questions.length;
  const score = random(total + 1);
  const limit = quiz.timeLimitSeconds ?? (quiz.perQuestionSeconds ?? 30) * total;
  const timeTakenSeconds = Math.max(20, random(limit));
  const startedAt = now - (1 + random(30)) * DAY_MS - random(DAY_MS);
  const completedAt = startedAt + timeTakenSeconds * 1000;
  const answers = quiz.questions.map((question, index) => {
    const isCorrect = index < score;
    const wrong = question.options.find(option => !question.correctOptionIds.includes(option.id));
    return {
      questionId: question.id,
      selectedOptionIds: isCorrect || !wrong ? question.correctOptionIds : [wrong.id],
      isCorrect,
      answeredAt: new Date(startedAt + ((index + 1) * timeTakenSeconds * 1000) / total).toISOString()
    };
  });
  return {
    id,
    quizId: quiz.id,
    userId: user.id,
    quizVersion: quiz.version,
    status: 'completed',
    endReason: 'submitted',
    startedAt: new Date(startedAt).toISOString(),
    currentQuestionIndex: total,
    answers,
    draftOptionIds: [],
    completedAt: new Date(completedAt).toISOString(),
    score,
    totalQuestions: total,
    percentage: Math.round((score / total) * 1000) / 10,
    timeTakenSeconds
  };
};

export const addTestData = (data: QuizData, now: number): QuizData => {
  const random = createRandom(42);
  const quizzes = [...data.quizzes, ...TOPICS.map((topic, index) => makeQuiz(topic, index, random))];
  const newUsers: User[] = FIRST_NAMES.flatMap((first, firstIndex) =>
    LAST_NAMES.map((last, lastIndex) => ({
      id: `t-u${String(firstIndex * LAST_NAMES.length + lastIndex + 1)}`,
      name: `${first} ${last}`,
      country: pick(USER_COUNTRIES, firstIndex + lastIndex),
      role: 'user' as const
    }))
  );
  const seedQuizIds = new Set(data.quizzes.map(quiz => quiz.id));
  let attemptCount = 0;
  const newAttempts = newUsers.flatMap(user =>
    quizzes
      .filter(quiz => quiz.countries.includes(user.country))
      .filter(quiz => seedQuizIds.has(quiz.id) || random(3) === 0)
      .map(quiz => {
        attemptCount += 1;
        return makeAttempt(quiz, user, `t-a${String(attemptCount)}`, now, random);
      })
  );
  return { ...data, quizzes, users: [...data.users, ...newUsers], attempts: [...data.attempts, ...newAttempts] };
};
