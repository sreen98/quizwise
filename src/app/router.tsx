import { Navigate, type RouteObject } from 'react-router';
import { AdminOnly } from '../components/AdminOnly';
import { AppLayout } from '../components/AppLayout';
import { RouteError } from '../components/RouteError';
import { RootLayout } from '../components/RootLayout';
import { AttemptEndedPage } from '../pages/AttemptEndedPage';
import { AttemptPage } from '../pages/AttemptPage';
import { LeaderboardPage } from '../pages/LeaderboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { QuizListPage } from '../pages/QuizListPage';
import { QuizStartPage } from '../pages/QuizStartPage';
import { ResultsPage } from '../pages/ResultsPage';
import { AdminQuizListPage, QuizEditorPage } from './adminPages';

export const routes: RouteObject[] = [
  {
    Component: RootLayout,
    children: [
      {
        path: '/',
        Component: AppLayout,
        ErrorBoundary: RouteError,
        children: [
          { index: true, element: <Navigate to="/quizzes" replace /> },
          { path: 'quizzes', Component: QuizListPage },
          { path: 'quizzes/:quizId', Component: QuizStartPage },
          { path: 'attempts/:attemptId/ended', Component: AttemptEndedPage },
          { path: 'attempts/:attemptId/results', Component: ResultsPage },
          { path: 'leaderboard/:quizId?', Component: LeaderboardPage },
          {
            Component: AdminOnly,
            children: [
              { path: 'admin', Component: AdminQuizListPage },
              { path: 'admin/quizzes/new', Component: QuizEditorPage },
              { path: 'admin/quizzes/:quizId/edit', Component: QuizEditorPage }
            ]
          },
          { path: '*', Component: NotFoundPage }
        ]
      },
      { path: '/attempts/:attemptId', Component: AttemptPage, ErrorBoundary: RouteError }
    ]
  }
];
