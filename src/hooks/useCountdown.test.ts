import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from './useCountdown';

const START = Date.parse('2026-10-17T10:00:00Z');
const at = (seconds: number) => START + seconds * 1000;

const advance = (milliseconds: number) => {
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });
};

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down from the deadline', () => {
    const { result } = renderHook(() => useCountdown({ deadlineAt: at(60), limitSeconds: 60, onExpire: vi.fn() }));

    expect(result.current.remainingMs).toBe(60_000);
    advance(1000);
    expect(result.current.remainingMs).toBe(59_000);
  });

  it('has no remaining time and never expires without a deadline', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown({ deadlineAt: null, limitSeconds: null, onExpire }));

    advance(120_000);

    expect(result.current.remainingMs).toBeNull();
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('calls onExpire once when the time runs out', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown({ deadlineAt: at(5), limitSeconds: 5, onExpire }));

    advance(5000);
    advance(10_000);

    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(result.current.remainingMs).toBe(0);
  });

  it('expires straight away when the deadline has already passed', () => {
    const onExpire = vi.fn();
    renderHook(() => useCountdown({ deadlineAt: at(-30), limitSeconds: 60, onExpire }));

    advance(0);

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('is correct again as soon as a hidden tab becomes visible', () => {
    const { result } = renderHook(() => useCountdown({ deadlineAt: at(60), limitSeconds: 60, onExpire: vi.fn() }));

    vi.setSystemTime(at(40));
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.remainingMs).toBe(20_000);
  });

  it('starts again for a new deadline', () => {
    const onExpire = vi.fn();
    const { rerender } = renderHook(({ deadlineAt }) => useCountdown({ deadlineAt, limitSeconds: 5, onExpire }), {
      initialProps: { deadlineAt: at(5) }
    });

    advance(5000);
    rerender({ deadlineAt: at(10) });
    advance(5000);

    expect(onExpire).toHaveBeenCalledTimes(2);
  });

  it('stops after unmounting', () => {
    const onExpire = vi.fn();
    const { unmount } = renderHook(() => useCountdown({ deadlineAt: at(5), limitSeconds: 5, onExpire }));

    unmount();
    advance(10_000);

    expect(onExpire).not.toHaveBeenCalled();
  });

  it('announces when 30 and 10 seconds are left', () => {
    const { result } = renderHook(() => useCountdown({ deadlineAt: at(60), limitSeconds: 60, onExpire: vi.fn() }));

    expect(result.current.announcement).toBe('');
    advance(30_000);
    expect(result.current.announcement).toBe('30 seconds left');
    advance(20_000);
    expect(result.current.announcement).toBe('10 seconds left');
  });

  it('skips a warning that is not shorter than the limit', () => {
    const { result } = renderHook(() => useCountdown({ deadlineAt: at(30), limitSeconds: 30, onExpire: vi.fn() }));

    advance(1000);
    expect(result.current.announcement).toBe('');
    advance(19_000);
    expect(result.current.announcement).toBe('10 seconds left');
  });
});
