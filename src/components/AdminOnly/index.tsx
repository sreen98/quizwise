import { Button } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { Suspense } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { AdminQuizListSkeleton } from '../AdminQuizListSkeleton';
import { MessageCard } from '../MessageCard';
import { QuizFormSkeleton } from '../QuizFormSkeleton';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useSessionStore } from '../../session/sessionStore';

export const AdminOnly = () => {
  const { user, adminUser, loading, isAdmin } = useCurrentUser();
  const setUserId = useSessionStore(state => state.setUserId);
  const { pathname } = useLocation();

  const placeholder =
    pathname === '/admin' ? (
      <AdminQuizListSkeleton withHeader />
    ) : (
      <QuizFormSkeleton isNew={pathname.endsWith('/new')} />
    );

  if (loading) return placeholder;

  if (isAdmin) {
    return (
      <Suspense fallback={placeholder}>
        <Outlet />
      </Suspense>
    );
  }

  return (
    <MessageCard
      icon={<IconLock size={38} />}
      color="orange"
      badge="Admins only"
      title="You don't have access to this page"
      actions={
        <>
          <Button component={Link} to="/quizzes" size="md">
            Back to quizzes
          </Button>
          {adminUser && (
            <Button
              variant="default"
              size="md"
              onClick={() => {
                setUserId(adminUser.id);
              }}
            >
              Switch to {adminUser.name}
            </Button>
          )}
        </>
      }
    >
      {user ? `${user.name} is` : 'You are'} viewing as a quiz taker. Managing quizzes is only for admin users.
    </MessageCard>
  );
};
