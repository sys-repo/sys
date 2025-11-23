import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { useDocStats } from '../use/mod.ts';
export { Crdt } from '../../-exports/-web/mod.ts';

/**
 * Constants:
 */
const name = 'Document';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
export const PATH = { meta: ['.meta'] };
