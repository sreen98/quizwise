const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 800;

let slowNetwork = true;

export const setSlowNetwork = (enabled: boolean) => {
  slowNetwork = enabled;
};

export const simulatedDelay = () =>
  slowNetwork ? MIN_DELAY_MS + Math.round(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)) : 0;
