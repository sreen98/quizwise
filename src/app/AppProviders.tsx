import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import type { PropsWithChildren } from 'react';
import { cssVariablesResolver, theme } from './theme';

export const AppProviders = ({ children }: PropsWithChildren) => {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="light"
      env={import.meta.env.MODE === 'test' ? 'test' : 'default'}
    >
      <ModalsProvider>
        <Notifications position="top-right" />
        {children}
      </ModalsProvider>
    </MantineProvider>
  );
};
