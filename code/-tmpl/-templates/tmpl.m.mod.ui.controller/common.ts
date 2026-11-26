import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';

type P = t.MyCtrl.Props;

/**
 * Constants:
 */
const name = 'MyCtrl';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
