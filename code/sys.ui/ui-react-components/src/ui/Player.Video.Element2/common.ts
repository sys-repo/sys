import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';
export * from './const.READY_STATE.ts';

/**
 * Constants:
 */
const name = 'VideoElement';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;
