import { MantineProvider } from '@mantine/core';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../app/router';
import { cssVariablesResolver, theme } from '../app/theme';

export const renderWithProviders = (ui: ReactNode) => {
  return render(
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver}>
      {ui}
    </MantineProvider>
  );
};

export const renderRoute = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return { router, ...renderWithProviders(<RouterProvider router={router} />) };
};
