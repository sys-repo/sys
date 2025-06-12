import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'TextEditor';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  autoFocus: false,
  disabled: false,
} as const;
export const D = DEFAULTS;
