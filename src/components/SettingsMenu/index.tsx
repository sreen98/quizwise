import { ActionIcon, Divider, Popover, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSettings } from '@tabler/icons-react';
import { ResetDataButton } from '../ResetDataButton';
import { SlowNetworkSwitch } from '../SlowNetworkSwitch';

export const SettingsMenu = () => {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <Popover opened={opened} onChange={toggle} position="bottom-end" width={260} shadow="md" trapFocus>
      <Popover.Target>
        <ActionIcon variant="subtle" color="gray" size={44} aria-label="Settings" onClick={toggle}>
          <IconSettings size={22} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm">
          <Text fw={600} size="sm">
            Settings
          </Text>
          <SlowNetworkSwitch />
          <Divider />
          <ResetDataButton onDone={close} />
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
