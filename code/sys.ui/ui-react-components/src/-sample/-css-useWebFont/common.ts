import { pkg, Pkg } from '../-test.ui.ts';
export * from '../-test.ui.ts';

/**
 * Constants:
 */
const name = 'sample:useWebFont';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;
