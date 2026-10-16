import { MantineProvider, Title } from '@mantine/core';
import { cssVariablesResolver, theme } from './theme';

export const App = () => {
  return (
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="light">
      <Title order={1}>Quizwise</Title>
    </MantineProvider>
  );
};
