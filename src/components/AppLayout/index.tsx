import { Anchor, AppShell, Box } from '@mantine/core';
import type { MouseEvent } from 'react';
import { Outlet } from 'react-router';
import { BottomNav } from '../BottomNav';
import { Header } from '../Header';
import classes from './AppLayout.module.css';

const skipToContent = (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault();
  const heading = document.querySelector<HTMLElement>('main h1');
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus();
};

export const AppLayout = () => {
  return (
    <AppShell header={{ height: { base: 60, sm: 68 } }} footer={{ height: { base: 64, sm: 0 } }}>
      <Anchor href="#main" className={classes.skipLink} onClick={skipToContent}>
        Skip to content
      </Anchor>
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main id="main">
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
