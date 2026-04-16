import { DataClient } from '../../m/m.client/mod.ts';
import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { DataClient };

type P = t.Mounts.Props;

/**
 * Constants:
 */
const name = 'Mounts';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
