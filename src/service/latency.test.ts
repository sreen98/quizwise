import { afterEach, describe, expect, it } from 'vitest';
import { setSlowNetwork, simulatedDelay } from './latency';

describe('simulatedDelay', () => {
  afterEach(() => {
    setSlowNetwork(true);
  });

  it('waits between 300 and 800 ms when slow network is on', () => {
    setSlowNetwork(true);
    const delays = Array.from({ length: 200 }, simulatedDelay);

    expect(Math.min(...delays)).toBeGreaterThanOrEqual(300);
    expect(Math.max(...delays)).toBeLessThanOrEqual(800);
  });

  it('does not wait when slow network is off', () => {
    setSlowNetwork(false);

    expect(simulatedDelay()).toBe(0);
  });
});
