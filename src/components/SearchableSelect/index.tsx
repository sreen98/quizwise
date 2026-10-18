import { CheckIcon, Combobox, Group, InputBase, ScrollArea, Text, useCombobox } from '@mantine/core';
import { useState } from 'react';
import type { SearchableSelectProps } from './types';

export const SearchableSelect = ({
  label,
  searchLabel,
  nothingFoundMessage,
  data,
  value,
  onChange
}: SearchableSelectProps) => {
  const [search, setSearch] = useState('');
  const combobox = useCombobox({
    onDropdownOpen: () => {
      combobox.focusSearchInput();
    },
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      combobox.focusTarget();
      setSearch('');
    }
  });

  const selectedLabel = data.find(option => option.value === value)?.label ?? '';
  const query = search.trim().toLowerCase();
  const matches = data.filter(option => option.label.toLowerCase().includes(query));

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={option => {
        onChange(option);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          label={label}
          aria-label={`${label}: ${selectedLabel}`}
          aria-haspopup="listbox"
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          onClick={() => {
            combobox.toggleDropdown();
          }}
        >
          <Text inherit truncate>
            {selectedLabel}
          </Text>
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Search
          aria-label={searchLabel}
          placeholder={searchLabel}
          value={search}
          onChange={event => {
            setSearch(event.currentTarget.value);
            combobox.updateSelectedOptionIndex();
          }}
        />
        <Combobox.Options>
          <ScrollArea.Autosize mah={260} type="scroll">
            {matches.map(option => (
              <Combobox.Option
                key={option.value}
                value={option.value}
                active={option.value === value}
                aria-selected={option.value === value}
              >
                <Group wrap="nowrap" gap={10}>
                  <Text inherit flex={1}>
                    {option.label}
                  </Text>
                  {option.value === value && <CheckIcon size={12} aria-hidden />}
                </Group>
              </Combobox.Option>
            ))}
            {matches.length === 0 && <Combobox.Empty>{nothingFoundMessage}</Combobox.Empty>}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
