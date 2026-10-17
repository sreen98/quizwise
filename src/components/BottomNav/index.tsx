import { Box, Divider, Drawer, Flex, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconListCheck, IconSettings, IconTrophy, IconUserCircle } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useUserOptions } from '../../hooks/useUserOptions';
import { ResetDataButton } from '../ResetDataButton';
import { SlowNetworkSwitch } from '../SlowNetworkSwitch';
import { UserSelect } from '../UserSelect';
import classes from './BottomNav.module.css';

const tabs = [
  { to: '/quizzes', label: 'Quizzes', icon: <IconListCheck size={22} aria-hidden /> },
  { to: '/leaderboard', label: 'Leaderboard', icon: <IconTrophy size={22} aria-hidden /> },
  { to: '/admin', label: 'Admin', icon: <IconSettings size={22} aria-hidden /> }
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

  return (
    <>
      <Box component="nav" aria-label="Main" className={classes.bar}>
        <SimpleGrid cols={4} spacing={0} h={64}>
          {tabs.map(tab => (
            <NavLink key={tab.to} to={tab.to} className={classes.tab}>
              {tabContent(tab.icon, tab.label)}
            </NavLink>
          ))}
          <UnstyledButton className={classes.tab} aria-expanded={accountOpened} onClick={openAccount}>
            {tabContent(<IconUserCircle size={22} aria-hidden />, 'Account')}
          </UnstyledButton>
        </SimpleGrid>
      </Box>

      <Drawer opened={accountOpened} onClose={closeAccount} title="Account" position="bottom" size={280} radius="lg">
        <Stack gap="sm" pb="md">
          <UserSelect userOptions={userOptions} onDone={closeAccount} />
          <Divider my={4} />
          <SlowNetworkSwitch />
          <ResetDataButton onDialogOpen={closeAccount} />
        </Stack>
      </Drawer>
    </>
  );
};
