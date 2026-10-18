import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

const WAIT_MS = 5000;

const focusHeading = (main: HTMLElement) => {
  const heading = main.querySelector('h1');
  if (!heading) return false;
  if (!main.contains(document.activeElement) || document.activeElement === main) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  return true;
};

export const useFocusHeadingOnNavigate = () => {
  const { pathname } = useLocation();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;

    const main = document.querySelector('main');
    if (!main) return;
    let hasFocused = focusHeading(main);

    const observer = new MutationObserver(() => {
      if (!hasFocused) hasFocused = focusHeading(main);
      else if (document.activeElement === document.body) focusHeading(main);
    });
    observer.observe(main, { childList: true, subtree: true });
    const timeout = setTimeout(() => {
      observer.disconnect();
    }, WAIT_MS);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [pathname]);
};
