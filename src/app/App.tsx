import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppProviders } from './AppProviders';
import { routes } from './router';

const router = createBrowserRouter(routes);

export const App = () => {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};
