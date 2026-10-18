import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';

export const ColorSchemeToggle = () => {
  const { setColorScheme } = useMantineColorScheme();
  const isDark = useComputedColorScheme('light', { getInitialValueInEffect: false }) === 'dark';

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size={44}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => {
        setColorScheme(isDark ? 'light' : 'dark');
      }}
    >
      {isDark ? <IconSun size={22} aria-hidden /> : <IconMoon size={22} aria-hidden />}
    </ActionIcon>
  );
};
