import { Checkbox, Group, Radio, Stack, Text } from '@mantine/core';
import classes from './OptionList.module.css';
import type { OptionListProps } from './types';

export const OptionList = ({ type, options, value, onChange, disabled }: OptionListProps) => {
  const cards = options.map(option => {
    const Card = type === 'single' ? Radio.Card : Checkbox.Card;
    const Indicator = type === 'single' ? Radio.Indicator : Checkbox.Indicator;

    return (
      <Card
        key={option.id}
        value={option.id}
        disabled={disabled}
        className={classes.card}
        radius="lg"
        mih={64}
        px={20}
        py={14}
      >
        <Group gap={16} wrap="nowrap">
          <Indicator size="md" />
          <Text fz={{ base: 17, sm: 18 }} fw={600}>
            {option.text}
          </Text>
        </Group>
      </Card>
    );
  });

  if (type === 'single') {
    return (
      <Radio.Group
        value={value[0] ?? null}
        onChange={optionId => {
          onChange([optionId]);
        }}
      >
        <Stack gap={12}>{cards}</Stack>
      </Radio.Group>
    );
  }

  return (
    <Checkbox.Group value={value} onChange={onChange}>
      <Stack gap={12}>{cards}</Stack>
    </Checkbox.Group>
  );
};
