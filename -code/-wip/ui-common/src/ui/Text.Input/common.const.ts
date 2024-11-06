import { Color, type t } from '../common.ts';

const systemFont = {
  weights: { thin: 100, light: 300, normal: 400, bold: 900 },
  monospace: { family: 'monospace' },
  sans: { family: 'sans-serif' },
} as const;

const focusActions: t.TextInputFocusProps['focusAction'][] = [
  'Select',
  'Cursor:Start',
  'Cursor:End',
];

const toStyles = (theme: t.CommonTheme): t.TextInputStyle => {
  const color = Color.theme(theme).fg;
  return {
    opacity: 1,
    color,
    disabledColor: color,
    italic: false,
    fontSize: 16,
    fontWeight: undefined,
    fontFamily: undefined,
    letterSpacing: undefined,
    lineHeight: undefined,
  };
};

const style = {
  light: toStyles('Light'),
  dark: toStyles('Dark'),
  placeholder: {
    italic: false,
    opacity: { light: 0.2, dark: 0.23 },
  },
} as const;

export const DEFAULTS = {
  focusActions,
  systemFont,
  style,
  theme: (theme: t.CommonTheme = 'Light') => (theme === 'Light' ? style.light : style.dark),
  props: {
    isEnabled: true,
    isReadOnly: false,
    isPassword: false,
    autoCapitalize: false,
    autoComplete: false,
    autoCorrect: false,
    autoSize: false,
    spellCheck: false,
    focusOnLoad: false,
    disabledOpacity: 0.2,
  },
} as const;
