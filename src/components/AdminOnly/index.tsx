import { Badge, Button, Flex, Paper, Skeleton, Text, Title } from '@mantine/core';
import { Suspense } from 'react';
import { Link, Outlet } from 'react-router';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useSessionStore } from '../../session/sessionStore';

export const AdminOnly = () => {
  const { user, adminUser, loading, isAdmin } = useCurrentUser();
  const setUserId = useSessionStore(state => state.setUserId);

  const placeholder = <Skeleton h={320} radius="lg" />;

  if (loading) return placeholder;

  if (isAdmin) {
    return (
      <Suspense fallback={placeholder}>
        <Outlet />
      </Suspense>
    );
  }

  return (
    <Flex align="center" justify="center" mih={{ base: 'auto', sm: 'calc(100dvh - 116px)' }}>
      <Paper
        component="section"
        aria-labelledby="no-access-title"
        withBorder
        radius="lg"
        w="100%"
        maw={720}
        px={{ base: 24, sm: 48 }}
        py={{ base: 32, sm: 48 }}
        ta="center"
      >
        <Badge color="orange" mb={16}>
          Admins only
        </Badge>
        <Title id="no-access-title" order={1} fz={{ base: 26, sm: 30 }} lts="-0.01em" mb={12}>
          You don't have access to this page
        </Title>
        <Text c="dimmed" fz={16} lh={1.6} mb={28}>
          {user ? `${user.name} is` : 'You are'} viewing as a quiz taker. Managing quizzes is only for admin users.
        </Text>
        <Flex direction={{ base: 'column', sm: 'row' }} justify="center" gap={12}>
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
        </Flex>
      </Paper>
    </Flex>
  );
};
