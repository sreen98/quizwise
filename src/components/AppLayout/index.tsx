import { AppShell, Box } from '@mantine/core';
import { Outlet } from 'react-router';
import { BottomNav } from '../BottomNav';
import { Header } from '../Header';

export const AppLayout = () => {
  return (
    <AppShell header={{ height: { base: 60, sm: 68 } }} footer={{ height: { base: 64, sm: 0 } }}>
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main>
        <Box px={{ base: 16, sm: 24 }} py={{ base: 16, sm: 24 }}>
          <Outlet />
        </Box>
      </AppShell.Main>
      <AppShell.Footer hiddenFrom="sm">
        <BottomNav />
      </AppShell.Footer>
    </AppShell>
  );
};
