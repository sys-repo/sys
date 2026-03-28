import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';

type P = t.DevCrdt.Props;

/**
 * Constants:
 */
const name = 'Dev.Crdt';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
