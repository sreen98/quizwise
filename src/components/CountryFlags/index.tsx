import { Box, Group, Text, Tooltip } from '@mantine/core';
import type { CountryFlagsProps } from './types';

const MAX_SHOWN = 3;

export const CountryFlags = ({ codes, countries }: CountryFlagsProps) => {
  const names = codes.map(code => countries.find(country => country.code === code)?.name ?? code);
  const hiddenCount = codes.length - MAX_SHOWN;

  return (
    <Tooltip label={names.join(', ')} withArrow multiline maw={240}>
      <Group gap={6} wrap="nowrap" role="img" aria-label={`Available in ${names.join(', ')}`}>
        {codes.slice(0, MAX_SHOWN).map(code => (
          <Box
            key={code}
            component="span"
            className={`fi fis fi-${code.toLowerCase()}`}
            w={20}
            h={20}
            lh={0}
            bdrs="50%"
            bd="1px solid var(--mantine-color-default-border)"
          />
        ))}
        {hiddenCount > 0 && (
          <Text fz={13} fw={600} c="dimmed">
            +{hiddenCount}
          </Text>
        )}
      </Group>
    </Tooltip>
  );
};
