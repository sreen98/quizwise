import { Anchor, Burger, Drawer, Group, Stack, ThemeIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCheck } from '@tabler/icons-react';
import { Link, NavLink } from 'react-router';
import classes from './Header.module.css';

const NAV_LINKS = [
  { to: '/quizzes', label: 'Quizzes' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/admin', label: 'Admin' }
];

export const Header = () => {
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] = useDisclosure();

  const links = NAV_LINKS.map(link => (
    <NavLink key={link.to} to={link.to} className={classes.link} onClick={closeMenu}>
      {link.label}
    </NavLink>
  ));

  return (
    <Group h="100%" maw={1200} mx="auto" pl={{ base: 16, sm: 24 }} pr={{ base: 8, sm: 24 }} gap={20} wrap="nowrap">
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

      <Burger opened={menuOpened} onClick={toggleMenu} hiddenFrom="sm" ml="auto" aria-label="Open menu" />

      <Drawer opened={menuOpened} onClose={closeMenu} title="Menu" position="right" size="xs" hiddenFrom="sm">
        <Stack component="nav" aria-label="Main" gap={4}>
          {links}
        </Stack>
      </Drawer>
    </Group>
  );
};
