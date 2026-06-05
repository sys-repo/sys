import { pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export type * as t from './t.ts';

/**
 * Constants:
 */
const name = 'Sample.Css.Scroll';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
