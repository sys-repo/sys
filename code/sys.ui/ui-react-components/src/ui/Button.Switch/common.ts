import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Button.Switch';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  enabled: true,
} as const;
export const D = DEFAULTS;
