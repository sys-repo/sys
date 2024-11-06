import { Color, pkg, type t } from './common.ts';

export * from '../common.ts';

export { useFocus } from '../../ui.use/mod.ts';
export { KeyHint } from '../KeyHint/mod.ts';
export { Spinner } from '../Spinner/mod.ts';
export { TextInput } from '../Text.Input/mod.ts';
export { TextboxSync } from '../Textbox.Sync/mod.ts';

/**
 * Constants
 */
const paths: t.CmdBarPaths = {
  cmd: ['cmd'],
  text: ['text'],
  meta: ['meta'],
};

const focusBorder: t.CmdBarFocusBorder = {
  offset: -2,
  color: {
    focused: Color.BLUE,
    unfocused: (theme) => theme.alpha(theme.is.light ? 0.4 : 1).fg,
  },
};

const props: t.PickRequired<
  t.CmdBarProps,
  'theme' | 'enabled' | 'spinning' | 'readOnly' | 'useKeyboard' | 'focusOnReady' | 'placeholder'
> = {
  theme: 'Dark',
  placeholder: 'command',
  enabled: true,
  spinning: false,
  readOnly: false,
  useKeyboard: true,
  focusOnReady: true,
};

const name = 'CmdBar';
export const DEFAULTS = {
  name,
  displayName: `${pkg.name}:${name}`,
  props,
  paths,
  focusBorder,
} as const;
