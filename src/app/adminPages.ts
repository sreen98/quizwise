import { lazy } from 'react';

export const AdminQuizListPage = lazy(() =>
  import('../pages/admin/AdminQuizListPage').then(module => ({ default: module.AdminQuizListPage }))
);

export const QuizEditorPage = lazy(() =>
  import('../pages/admin/QuizEditorPage').then(module => ({ default: module.QuizEditorPage }))
);
