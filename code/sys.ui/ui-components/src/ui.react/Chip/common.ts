import { Pkg, pkg, type t } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = 'Chip';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  size: 'sm' as t.Chip.Size,
  mono: false,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
