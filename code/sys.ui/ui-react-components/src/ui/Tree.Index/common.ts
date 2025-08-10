import { pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { Icons } from '../ui.Icons.ts';

/**
 * Constants:
 */
const name = 'Tree.Index';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  minWidth: 280,
} as const;
export const D = DEFAULTS;
