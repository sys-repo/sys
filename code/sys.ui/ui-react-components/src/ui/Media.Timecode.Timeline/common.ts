import { type t, pkg, Pkg, Time } from '../common.ts';

export * from '../common.ts';

export { Bullet } from '../Bullet/mod.ts';
export { Cropmarks } from '../Cropmarks/mod.ts';
export { KeyValue } from '../KeyValue/mod.ts';
export { ObjectView } from '../ObjectView/mod.ts';
export { Player } from '../Player/mod.ts';
export { Icons } from '../ui.Icons.ts';
export { Playback } from '../Media.Timecode.Playback/mod.ts';

/**
 * Constants:
 */
const name = 'MediaTimecode.Timeline';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };

/**
 * Helpers:
 */
export function dur(ms: t.Msecs = 0, empty = '-') {
  return ms ? String(Time.Duration.create(ms)) : empty;
}
