export * from '../common.ts';
export { Input } from '../ui/mod.ts';

import { pkg, Pkg } from '../common.ts';

/**
 * Constants:
 */
const name = 'Crdt.Card';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),
} as const;
export const D = DEFAULTS;
