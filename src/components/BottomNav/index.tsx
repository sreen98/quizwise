import { Box, Divider, Drawer, Flex, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconListCheck, IconSettings, IconTrophy, IconUserCircle } from '@tabler/icons-react';
import { useRef, type ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useUserOptions } from '../../hooks/useUserOptions';
import { ResetDataButton } from '../ResetDataButton';
import { SlowNetworkSwitch } from '../SlowNetworkSwitch';
import { TestDataButton } from '../TestDataButton';
import { UserList } from '../UserList';
import classes from './BottomNav.module.css';

const tabs = [
  { to: '/quizzes', label: 'Quizzes', icon: <IconListCheck size={22} aria-hidden />, isAdminOnly: false },
  { to: '/leaderboard', label: 'Leaderboard', icon: <IconTrophy size={22} aria-hidden />, isAdminOnly: false },
  { to: '/admin', label: 'Admin', icon: <IconSettings size={22} aria-hidden />, isAdminOnly: true }
];

const tabContent = (icon: ReactNode, label: string) => (
  <Flex direction="column" align="center" justify="center" gap={2} h="100%">
    <Flex className={classes.icon} px={16} py={2} bdrs="lg">
      {icon}
    </Flex>
    <Text component="span" fz={12} fw={600} inherit={false} c="inherit">
      {label}
    </Text>
  </Flex>
);

export const BottomNav = () => {
  const [accountOpened, { open: openAccount, close: closeAccount }] = useDisclosure();
  const userOptions = useUserOptions();
  const { isAdmin } = useCurrentUser();
  const shownTabs = tabs.filter(tab => isAdmin || !tab.isAdminOnly);
  const accountRef = useRef<HTMLButtonElement>(null);

  const handleDialogOpen = () => {
    closeAccount();
    accountRef.current?.focus();
  };

  return (
    <>
      <Box component="nav" aria-label="Main" className={classes.bar}>
        <SimpleGrid cols={shownTabs.length + 1} spacing={0} h={64}>
          {shownTabs.map(tab => (
            <NavLink key={tab.to} to={tab.to} className={classes.tab}>
              {tabContent(tab.icon, tab.label)}
            </NavLink>
          ))}
          <UnstyledButton ref={accountRef} className={classes.tab} aria-expanded={accountOpened} onClick={openAccount}>
            {tabContent(<IconUserCircle size={22} aria-hidden />, 'Account')}
          </UnstyledButton>
        </SimpleGrid>
      </Box>

      <Drawer
        opened={accountOpened}
        onClose={closeAccount}
        title="Account"
        position="bottom"
        classNames={{ content: classes.sheet }}
        radius="lg"
      >
        <Stack gap="sm" pb="md">
          <UserList userOptions={userOptions} onDone={closeAccount} />
          <Divider my={4} />
          <SlowNetworkSwitch />
          <ResetDataButton onDialogOpen={handleDialogOpen} />
          {import.meta.env.DEV && <TestDataButton onDialogOpen={handleDialogOpen} />}
        </Stack>
      </Drawer>
    </>
  );
};
