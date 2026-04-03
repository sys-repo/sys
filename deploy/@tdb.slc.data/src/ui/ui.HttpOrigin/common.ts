import { type t } from '../common.ts';

export * from '../common.ts';

type P = t.HttpOrigin.Props;

/**
 * Constants:
 */
const name = 'HttpOrigin';
export const D = { name, displayName: `@tdb/slc-data:${name}` } as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
