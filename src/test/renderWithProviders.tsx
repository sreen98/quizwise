import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '../app/AppProviders';
import { routes } from '../app/router';

export const renderWithProviders = (ui: ReactNode) => {
  return render(<AppProviders>{ui}</AppProviders>);
};

export const renderRoute = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return { router, ...renderWithProviders(<RouterProvider router={router} />) };
};
