import { Pkg, pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Bullet';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  size: 8,
  borderOpacity: 0.16,
  selected: false,
  filled: false,
} as const;
export const D = DEFAULTS;
