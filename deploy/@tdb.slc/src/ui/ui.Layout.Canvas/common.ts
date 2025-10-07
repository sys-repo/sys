import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Layout.Canvas';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  borderRadius: 0,
  borderWidth: 8,
} as const;
export const D = DEFAULTS;
