import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Cropmarks';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  margin: 40,
} as const;
export const D = DEFAULTS;
