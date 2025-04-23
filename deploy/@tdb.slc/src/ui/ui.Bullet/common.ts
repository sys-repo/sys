import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Bullet';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  size: 8,
} as const;
export const D = DEFAULTS;
