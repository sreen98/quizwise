import { Outlet, ScrollRestoration } from 'react-router';
import { useFocusHeadingOnNavigate } from '../../hooks/useFocusHeadingOnNavigate';

export const RootLayout = () => {
  useFocusHeadingOnNavigate();

  return (
    <>
      <ScrollRestoration getKey={location => location.pathname} />
      <Outlet />
    </>
  );
};
