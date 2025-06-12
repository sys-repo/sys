import { type t, Color, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const border: t.TextInputBorder = {
  mode: 'outline',
  defaultColor: 0.3,
  focusColor: Color.BLUE,
};

const name = 'Text.Input';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  padding: 6,
  background: 1,
  border,
  borderRadius: 0,
  disabled: false,
  spellCheck: false,
  autoFocus: false,
} as const;
export const D = DEFAULTS;
