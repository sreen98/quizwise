import { AppShell, Box } from '@mantine/core';
import { Outlet } from 'react-router';
import { Header } from '../Header';

export const AppLayout = () => {
  return (
    <AppShell header={{ height: { base: 60, sm: 68 } }}>
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main>
        <Box px={{ base: 16, sm: 24 }} pt={{ base: 24, sm: 40 }} pb={64}>
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
};
