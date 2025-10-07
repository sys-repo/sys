import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'ValidationErrors';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  title: 'Validation Error',
} as const;
export const D = DEFAULTS;
