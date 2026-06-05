import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { Button } from '../Button/mod.ts';
export { ObjectView } from '../ObjectView/mod.ts';
export { Icons } from '../common/u.icons.ts';

/**
 * Constants:
 */
const name = 'ErrorBoundary';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
