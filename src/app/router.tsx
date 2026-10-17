import { Navigate, type RouteObject } from 'react-router';
import { AppLayout } from '../components/AppLayout';
import { RouteError } from '../components/RouteError';
import { AttemptPage } from '../pages/AttemptPage';
import { LeaderboardPage } from '../pages/LeaderboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { QuizListPage } from '../pages/QuizListPage';
import { QuizStartPage } from '../pages/QuizStartPage';
import { ResultsPage } from '../pages/ResultsPage';
import { AdminQuizListPage } from '../pages/admin/AdminQuizListPage';
import { QuizEditorPage } from '../pages/admin/QuizEditorPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: AppLayout,
    ErrorBoundary: RouteError,
    children: [
      { index: true, element: <Navigate to="/quizzes" replace /> },
      { path: 'quizzes', Component: QuizListPage },
      { path: 'quizzes/:quizId', Component: QuizStartPage },
      { path: 'attempts/:attemptId/results', Component: ResultsPage },
      { path: 'leaderboard/:quizId?', Component: LeaderboardPage },
      { path: 'admin', Component: AdminQuizListPage },
      { path: 'admin/quizzes/new', Component: QuizEditorPage },
      { path: 'admin/quizzes/:quizId/edit', Component: QuizEditorPage },
      { path: '*', Component: NotFoundPage }
    ]
  },
  { path: '/attempts/:attemptId', Component: AttemptPage, ErrorBoundary: RouteError }
];
