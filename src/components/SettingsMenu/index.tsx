import { ActionIcon, Divider, Popover, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSettings } from '@tabler/icons-react';
import { useRef } from 'react';
import { ResetDataButton } from '../ResetDataButton';
import { SlowNetworkSwitch } from '../SlowNetworkSwitch';
import { TestDataButton } from '../TestDataButton';

export const SettingsMenu = () => {
  const [opened, { toggle, close }] = useDisclosure();
  const targetRef = useRef<HTMLButtonElement>(null);

  const handleDialogOpen = () => {
    close();
    targetRef.current?.focus();
  };

  return (
    <Popover opened={opened} onChange={toggle} position="bottom-end" width={260} shadow="md" trapFocus>
      <Popover.Target>
        <ActionIcon
          ref={targetRef}
          variant={opened ? 'light' : 'subtle'}
          color={opened ? 'blue' : 'gray'}
          size={44}
          aria-label="Settings"
          onClick={toggle}
        >
          <IconSettings size={22} aria-hidden />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown aria-label="Settings">
        <Stack gap="sm">
          <SlowNetworkSwitch />
          <Divider />
          <ResetDataButton onDialogOpen={handleDialogOpen} />
          {import.meta.env.DEV && <TestDataButton onDialogOpen={handleDialogOpen} />}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
