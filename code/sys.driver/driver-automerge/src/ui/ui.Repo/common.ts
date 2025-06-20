import { pkg, Pkg } from '../common.ts';

export { Crdt } from '../../m.Crdt.platforms/-browser/mod.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Repo';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
  syncEnabled: true,
  silent: false,
} as const;
export const D = DEFAULTS;
