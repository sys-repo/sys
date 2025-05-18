import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'PlayList';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  gap: 20,
  bulletSize: 9,
  paddingTop: 0,
} as const;
export const D = DEFAULTS;
