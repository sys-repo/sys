import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = 'RectGrid';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  activeIndex: 0,
  minColumnWidth: 280,
  aspectRatio: undefined,
  gap: 16,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
