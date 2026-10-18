import { Group, Kbd, Text } from '@mantine/core';
import { IconKeyboard } from '@tabler/icons-react';

export const KeyboardHint = () => (
  <Group gap={8} wrap="wrap" c="dimmed" fz={14}>
    <IconKeyboard size={18} aria-hidden />
    <Text component="span" inherit>
      <Kbd>Tab</Kbd> to move · <Kbd>Space</Kbd> to select · <Kbd>Enter</Kbd> to submit
    </Text>
  </Group>
);
