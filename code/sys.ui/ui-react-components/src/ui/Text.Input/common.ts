import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Text.Input';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  disabled: false,
  autoFocus: false,
} as const;
export const D = DEFAULTS;
