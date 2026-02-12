import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { Button } from '../Button/mod.ts';

type P = t.Tabs.Props;

/**
 * Constants:
 */
const name = 'Layout.Tabs';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
