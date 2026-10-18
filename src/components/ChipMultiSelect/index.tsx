import { Box, Button, CheckIcon, Combobox, Group, InputBase, ScrollArea, useCombobox } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useState } from 'react';
import type { ChipMultiSelectProps } from './types';

export const ChipMultiSelect = ({
  label,
  placeholder,
  nothingFoundMessage,
  data,
  value,
  onChange,
  error,
  onFocus,
  onBlur
}: ChipMultiSelectProps) => {
  const [search, setSearch] = useState('');
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
    }
  });

  const toggle = (option: string) => {
    onChange(value.includes(option) ? value.filter(item => item !== option) : [...value, option]);
  };

  const query = search.trim().toLowerCase();
  const matches = data.filter(item => item.label.toLowerCase().includes(query));
  const selected = value.flatMap(item => data.filter(option => option.value === item));

  return (
    <Box>
      <Combobox
        store={combobox}
        onOptionSubmit={option => {
          toggle(option);
          setSearch('');
        }}
      >
        <Combobox.Target>
          <InputBase
            role="combobox"
            label={label}
            placeholder={placeholder}
            value={search}
            error={error}
            rightSection={<Combobox.Chevron />}
            rightSectionPointerEvents="none"
            onChange={event => {
              setSearch(event.currentTarget.value);
              combobox.openDropdown();
              combobox.updateSelectedOptionIndex();
            }}
            onClick={() => {
              combobox.openDropdown();
            }}
            onFocus={() => {
              combobox.openDropdown();
              onFocus?.();
            }}
            onBlur={() => {
              combobox.closeDropdown();
              setSearch('');
              onBlur?.();
            }}
          />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            <ScrollArea.Autosize mah={240} type="scroll">
              {matches.length === 0 ? (
                <Combobox.Empty>{nothingFoundMessage}</Combobox.Empty>
              ) : (
                matches.map(item => (
                  <Combobox.Option key={item.value} value={item.value} active={value.includes(item.value)}>
                    <Group justify="space-between" wrap="nowrap" gap={8}>
                      {item.label}
                      {value.includes(item.value) && <CheckIcon size={12} aria-hidden />}
                    </Group>
                  </Combobox.Option>
                ))
              )}
            </ScrollArea.Autosize>
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
      {selected.length > 0 && (
        <Group gap={8} mt={10}>
          {selected.map(item => (
            <Button
              key={item.value}
              variant="light"
              radius="lg"
              size="compact-md"
              rightSection={<IconX size={16} aria-hidden />}
              aria-label={`Remove ${item.label}`}
              onClick={() => {
                toggle(item.value);
              }}
            >
              {item.label}
            </Button>
          ))}
        </Group>
      )}
    </Box>
  );
};
