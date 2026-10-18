import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';

const SEARCH_DELAY_MS = 250;

export const useDebouncedSearch = (initial = '') => {
  const [search, setSearch] = useState(initial);
  const [debouncedSearch] = useDebouncedValue(search, SEARCH_DELAY_MS);

  return { search, setSearch, debouncedSearch, query: debouncedSearch.trim().toLowerCase() };
};
