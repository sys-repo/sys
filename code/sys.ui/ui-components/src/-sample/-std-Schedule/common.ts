import { pkg, Pkg } from '../-test.ui.ts';
export * from '../-test.ui.ts';

/**
 * Constants:
 */
const name = 'Sample: Schedule';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
