import { Box, CheckIcon, Combobox, Group, InputBase, ScrollArea, Text, useCombobox } from '@mantine/core';
import { useState } from 'react';
import { Flag } from '../Flag';
import type { CountryFilterProps } from './types';

const ALL = 'all';

export const CountryFilter = ({ countries, value, onChange }: CountryFilterProps) => {
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

  const selected = countries.filter(country => value.includes(country.code));
  const [firstSelected] = selected;
  let summary = '';
  if (countries.length > 0) {
    if (!firstSelected) summary = 'All countries';
    else if (selected.length === 1) summary = firstSelected.name;
    else summary = `${String(selected.length)} countries`;
  }
  const query = search.trim().toLowerCase();
  const matches = countries.filter(country => country.name.toLowerCase().includes(query));

  const option = (code: string, name: string, isChecked: boolean) => (
    <Combobox.Option key={code} value={code} active={isChecked} aria-selected={isChecked}>
      <Group wrap="nowrap" gap={10}>
        {code === ALL ? <Box w={20} /> : <Flag code={code} />}
        <Text inherit flex={1}>
          {name}
        </Text>
        {isChecked && <CheckIcon size={12} aria-hidden />}
      </Group>
    </Combobox.Option>
  );

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={code => {
        if (code === ALL) onChange([]);
        else onChange(value.includes(code) ? value.filter(item => item !== code) : [...value, code]);
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          label="Country"
          aria-label={`Country: ${summary}`}
          aria-haspopup="listbox"
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          onClick={() => {
            combobox.toggleDropdown();
          }}
        >
          <Group gap={8} wrap="nowrap">
            {selected.slice(0, 3).map(country => (
              <Flag key={country.code} code={country.code} />
            ))}
            <Text inherit truncate>
              {summary}
            </Text>
          </Group>
        </InputBase>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Search
          aria-label="Search countries"
          placeholder="Search countries"
          value={search}
          onChange={event => {
            setSearch(event.currentTarget.value);
            combobox.updateSelectedOptionIndex();
          }}
        />
        <Combobox.Options>
          <ScrollArea.Autosize mah={260} type="scroll">
            {!query && option(ALL, 'All countries', value.length === 0)}
            {matches.map(country => option(country.code, country.name, value.includes(country.code)))}
            {matches.length === 0 && <Combobox.Empty>No countries found</Combobox.Empty>}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
