import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { TreeContentDriver } from '../ui.Driver.TreeContent/mod.ts';

/**
 * Constants:
 */
const name = 'FileContentDriver';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
