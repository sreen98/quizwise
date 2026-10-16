import { MantineProvider } from '@mantine/core';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { routes } from './router';
import { cssVariablesResolver, theme } from './theme';

const router = createBrowserRouter(routes);

export const App = () => {
  return (
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="light">
      <RouterProvider router={router} />
    </MantineProvider>
  );
};
