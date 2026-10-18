import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  CheckboxIndicator,
  createTheme,
  Drawer,
  Input,
  Modal,
  MultiSelect,
  Notification,
  Pagination,
  Radio,
  RadioIndicator,
  Select,
  Switch,
  ThemeIcon,
  type CSSVariablesResolver
} from '@mantine/core';
import classes from './theme.module.css';

const TOUCH_TARGET = '44px';
const FILLED_INK = 'var(--filled-ink)';

const isFilled = (variant: string | undefined) => (variant ?? 'filled') === 'filled';

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
    dark: ['#ECE8E1', '#CFC9BF', '#A9A298', '#8A8379', '#3A3631', '#322E2A', '#2A2724', '#221F1C', '#1A1816', '#121110']
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
  respectReducedMotion: true,
  components: {
    Modal: Modal.extend({ defaultProps: { centered: true, closeButtonProps: { 'aria-label': 'Close' } } }),
    Drawer: Drawer.extend({ defaultProps: { closeButtonProps: { 'aria-label': 'Close' } } }),
    Notification: Notification.extend({ defaultProps: { closeButtonProps: { 'aria-label': 'Dismiss notification' } } }),
    Button: Button.extend({
      classNames: { loader: classes.buttonLoader },
      vars: (_theme, { variant }) => ({
        root: { '--button-height': TOUCH_TARGET, '--button-color': isFilled(variant) ? FILLED_INK : undefined }
      })
    }),
    ThemeIcon: ThemeIcon.extend({
      vars: (_theme, { variant }) => ({ root: { '--ti-color': isFilled(variant) ? FILLED_INK : undefined } })
    }),
    Checkbox: Checkbox.extend({
      classNames: { input: classes.checkbox },
      vars: () => ({ root: { '--checkbox-icon-color': FILLED_INK } })
    }),
    CheckboxIndicator: CheckboxIndicator.extend({ classNames: { indicator: classes.checkboxIndicator } }),
    Radio: Radio.extend({
      classNames: { radio: classes.radio },
      vars: () => ({ root: { '--radio-icon-color': FILLED_INK } })
    }),
    RadioIndicator: RadioIndicator.extend({ classNames: { indicator: classes.radioIndicator } }),
    Pagination: Pagination.extend({
      vars: () => ({ root: { '--pagination-active-color': FILLED_INK, '--pagination-control-size': TOUCH_TARGET } })
    }),
    Avatar: Avatar.extend({
      vars: (_theme, { variant }) => ({ root: { '--avatar-color': variant === 'filled' ? FILLED_INK : undefined } })
    }),
    Input: Input.extend({
      classNames: { input: classes.input },
      vars: () => ({ wrapper: { '--input-height': TOUCH_TARGET } })
    }),
    Select: Select.extend({ defaultProps: { checkIconPosition: 'right' } }),
    MultiSelect: MultiSelect.extend({ defaultProps: { checkIconPosition: 'right' } }),
    Switch: Switch.extend({ styles: { body: { minHeight: TOUCH_TARGET, alignItems: 'center' } } }),
    Badge: Badge.extend({
      defaultProps: { variant: 'light', radius: 'xs', size: 'lg' },
      styles: { root: { textTransform: 'none', fontWeight: 600 } },
      vars: (_theme, { variant }) => ({ root: { '--badge-color': variant === 'filled' ? FILLED_INK : undefined } })
    })
  }
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
    '--mantine-color-error': '#A64B07',
    '--skeleton': '#E8E3DA',
    '--filled-ink': '#FFFDFA',
    '--control-border': '#8C8579',
    '--mantine-color-body': '#FFFDFA',
    '--mantine-color-text': '#181B21',
    '--mantine-color-dimmed': '#545964',
    '--mantine-color-default-border': '#DDD7CC'
  },
  dark: {
    '--bg': '#1A1816',
    '--surface': '#221F1C',
    '--surface-2': '#2A2724',
    '--accent-soft': '#252E40',
    '--warn': '#F6A963',
    '--warn-soft': '#3A2A1C',
    '--mantine-color-error': '#F6A963',
    '--skeleton': '#34302B',
    '--filled-ink': '#1A1816',
    '--control-border': '#7A7268',
    '--mantine-color-blue-light': '#252E40',
    '--mantine-color-blue-light-color': '#86A8FF',
    '--mantine-color-orange-light': '#3A2A1C',
    '--mantine-color-orange-light-color': '#F6A963'
  }
});
