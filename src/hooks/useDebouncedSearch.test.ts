import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedSearch } from './useDebouncedSearch';

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the typed text at once and filters only after typing pauses', () => {
    const { result } = renderHook(() => useDebouncedSearch());

    act(() => {
      result.current.setSearch('  React ');
    });
    expect(result.current.search).toBe('  React ');
    expect(result.current.query).toBe('');

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current.query).toBe('react');
    expect(result.current.debouncedSearch).toBe('  React ');
  });

  it('starts from the given search', () => {
    const { result } = renderHook(() => useDebouncedSearch('hooks'));

    expect(result.current.search).toBe('hooks');
    expect(result.current.query).toBe('hooks');
  });
});
