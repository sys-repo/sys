import { type t, pkg, Pkg } from '../common.ts';

export * as t from './common.t.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Sample: SlugLoader';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
