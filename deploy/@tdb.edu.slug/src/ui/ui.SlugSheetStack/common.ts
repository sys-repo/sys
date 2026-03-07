import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { SlugSheet } from '../ui.SlugSheet/mod.ts';

type P = t.SlugSheetStackProps;

/**
 * Constants:
 */
const name = 'SlugSheetStack';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
