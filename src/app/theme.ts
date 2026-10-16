import { createTheme, type CSSVariablesResolver } from '@mantine/core';

export const theme = createTheme({
  white: '#FFFDFA',
  black: '#181B21',
  colors: {
    blue: [
      '#EEF3FF',
      '#E7EDFD',
      '#C7D6FD',
      '#A6BFFF',
      '#86A8FF',
      '#5F87F0',
      '#3D69E3',
      '#1D4ED8',
      '#1940B3',
      '#14338C'
    ],
    orange: [
      '#FFF6EC',
      '#FDF0E2',
      '#FBDDBD',
      '#F8C38E',
      '#F6A963',
      '#E1873A',
      '#C4661C',
      '#A64B07',
      '#863C06',
      '#663005'
    ],
    dark: ['#E8EDF5', '#C9D2E0', '#A6B1C4', '#7D899E', '#2A3548', '#223047', '#182233', '#131B29', '#0B111C', '#070B13']
  },
  primaryColor: 'blue',
  primaryShade: { light: 7, dark: 4 },
  autoContrast: true,
  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  fontFamilyMonospace: "'IBM Plex Mono', ui-monospace, monospace",
  headings: {
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    fontWeight: '700'
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '15px',
    lg: '17px',
    xl: '20px'
  },
  radius: {
    xs: '5px',
    sm: '6px',
    md: '8px',
    lg: '10px',
    xl: '12px'
  },
  defaultRadius: 'md',
  respectReducedMotion: true
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--bg': '#F4F2EE',
    '--surface': '#FFFDFA',
    '--surface-2': '#F8F5F0',
    '--accent-soft': '#E7EDFD',
    '--warn': '#A64B07',
    '--warn-soft': '#FDF0E2',
    '--skeleton': '#E8E3DA',
    '--mantine-color-body': '#FFFDFA',
    '--mantine-color-text': '#181B21',
    '--mantine-color-dimmed': '#545964',
    '--mantine-color-default-border': '#DDD7CC'
  },
  dark: {
    '--bg': '#0B111C',
    '--surface': '#131B29',
    '--surface-2': '#182233',
    '--accent-soft': '#1B2947',
    '--warn': '#F6A963',
    '--warn-soft': '#3A2614',
    '--skeleton': '#223047'
  }
});
