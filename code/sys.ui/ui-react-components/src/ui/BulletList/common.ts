import { pkg, Pkg } from '../common.ts';

export { Bullet } from '../Bullet/mod.ts';
export { Button } from '../Button/mod.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'BulletList';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
