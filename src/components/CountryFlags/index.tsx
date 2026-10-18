import { Group, Text, Tooltip } from '@mantine/core';
import { Flag } from '../Flag';
import type { CountryFlagsProps } from './types';

const MAX_SHOWN = 3;

export const CountryFlags = ({ codes, countries }: CountryFlagsProps) => {
  const names = codes.map(code => countries.find(country => country.code === code)?.name ?? code);
  const hiddenCount = codes.length - MAX_SHOWN;

  return (
    <Tooltip label={names.join(', ')} withArrow multiline maw={240}>
      <Group gap={6} wrap="nowrap" w="fit-content" role="img" aria-label={`Available in ${names.join(', ')}`}>
        {codes.slice(0, MAX_SHOWN).map(code => (
          <Flag key={code} code={code} />
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
