import { Anchor, Burger, Divider, Drawer, Group, Stack, ThemeIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCheck } from '@tabler/icons-react';
import { useEffect } from 'react';
import { Link, NavLink } from 'react-router';
import { useUserOptions } from '../../hooks/useUserOptions';
import { DEFAULT_USER_ID, useSessionStore } from '../../session/sessionStore';
import { ResetDataButton } from '../ResetDataButton';
import { SettingsMenu } from '../SettingsMenu';
import { SlowNetworkSwitch } from '../SlowNetworkSwitch';
import { UserSelect } from '../UserSelect';
import classes from './Header.module.css';

const navLinks = [
  { to: '/quizzes', label: 'Quizzes' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/admin', label: 'Admin' }
];

export const Header = () => {
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] = useDisclosure();
  const userOptions = useUserOptions();
  const userId = useSessionStore(state => state.userId);
  const setUserId = useSessionStore(state => state.setUserId);

  useEffect(() => {
    const knownUser = userOptions.some(option => option.value === userId);
    if (userOptions.length > 0 && !knownUser) setUserId(DEFAULT_USER_ID);
  }, [userOptions, userId, setUserId]);

  const links = navLinks.map(link => (
    <NavLink key={link.to} to={link.to} className={classes.link} onClick={closeMenu}>
      {link.label}
    </NavLink>
  ));

  return (
    <Group h="100%" pl={{ base: 16, sm: 24 }} pr={{ base: 8, sm: 24 }} gap={20} wrap="nowrap">
      <Anchor
        component={Link}
        to="/quizzes"
        underline="never"
        c="var(--mantine-color-text)"
        fz={17}
        fw={700}
        lts="-0.01em"
      >
        <Group gap={10} wrap="nowrap">
          <ThemeIcon size={28} radius="md" aria-hidden>
            <IconCheck size={18} stroke={2.6} />
          </ThemeIcon>
          Quizwise
        </Group>
      </Anchor>

      <Group component="nav" aria-label="Main" gap={4} flex={1} visibleFrom="sm">
        {links}
      </Group>

      <Group gap={8} wrap="nowrap" visibleFrom="sm">
        <UserSelect userOptions={userOptions} />
        <SettingsMenu />
      </Group>

      <Burger
        opened={menuOpened}
        onClick={toggleMenu}
        hiddenFrom="sm"
        ml="auto"
        w={44}
        h={44}
        aria-label={menuOpened ? 'Close menu' : 'Open menu'}
      />

      <Drawer opened={menuOpened} onClose={closeMenu} title="Menu" position="right" size="xs" hiddenFrom="sm">
        <Stack component="nav" aria-label="Main" gap={4}>
          {links}
        </Stack>
        <Divider my="md" />
        <Stack gap="sm">
          <UserSelect userOptions={userOptions} onDone={closeMenu} />
          <SlowNetworkSwitch />
          <ResetDataButton onDone={closeMenu} />
        </Stack>
      </Drawer>
    </Group>
  );
};
