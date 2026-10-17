import { Switch } from '@mantine/core';
import { useSessionStore } from '../../session/sessionStore';

export const SlowNetworkSwitch = () => {
  const slowNetwork = useSessionStore(state => state.slowNetwork);
  const setSlowNetwork = useSessionStore(state => state.setSlowNetwork);

  return (
    <Switch
      label="Simulate slow network"
      description="300 to 800 ms"
      checked={slowNetwork}
      onChange={event => {
        setSlowNetwork(event.currentTarget.checked);
      }}
    />
  );
};
