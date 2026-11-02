import { Pkg, pkg } from '../-test.ui.ts';
export * from '../-test.ui.ts';
export { Dev } from '../common.ts';

/**
 * Constants:
 */
const name = 'sample:WebFont.useWebFont';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;
