import { type t, pkg, Time, Pkg } from '../common.ts';

export * from '../common.ts';

export { Bullet } from '../Bullet/mod.ts';
export { Cropmarks } from '../Cropmarks/mod.ts';
export { KeyValue } from '../KeyValue/mod.ts';
export { ObjectView } from '../ObjectView/mod.ts';
export { Player } from '../Player/mod.ts';

/**
 * Constants:
 */
const name = 'MediaTimecode';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };

/**
 * Helpers:
 */
export const dur = (ms: t.Msecs = 0) => (ms ? String(Time.Duration.create(ms)) : '-');
