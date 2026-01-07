import { type t, Time } from '../../common.ts';

/** Lib: */
export * from '../../common.ts';
export { PlaybackDriver } from '../../mod.ts';

/** Components: */
export { Bullet } from '../../../Bullet/mod.ts';
export { Cropmarks } from '../../../Cropmarks/mod.ts';
export { Dist } from '../../../Dist/mod.ts';
export { KeyValue } from '../../../KeyValue/mod.ts';
export { ObjectView } from '../../../ObjectView/mod.ts';
export { Player } from '../../../Player/mod.ts';
export { Spinners } from '../../../Spinners/mod.ts';
export { Icons } from '../../../ui.Icons.ts';

/**
 * Helpers:
 */
export function dur(ms: t.Msecs = 0, empty = '-') {
  return ms ? String(Time.Duration.create(ms)) : empty;
}
