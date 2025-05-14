import { pkg, Pkg } from '../common.ts';
export { Bullet } from '../Bullet/mod.ts';
export { Button } from '../Button/mod.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Media.Devies';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  rowGap: 6,
} as const;
export const D = DEFAULTS;
