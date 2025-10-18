import { makeLogger, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { Bullet } from '../Bullet/mod.ts';
export { Button } from '../Button/mod.ts';
export { Spinners } from '../Spinners/mod.ts';

export const logInfo = makeLogger('Media.Devices');

/**
 * Constants:
 */
const name = 'Media.Device';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  rowGap: 8,
} as const;
export const D = DEFAULTS;
