import { type t, Time } from '../common.ts';

/** Lib: */
export * from '../common.ts';
export { PlaybackDriver } from '../m.Driver.ts';

/** Components: */
export { Bullet } from '../../Bullet/mod.ts';
export { Button } from '../../Button/mod.ts';
export { Cropmarks } from '../../Cropmarks/mod.ts';
export { Dist } from '../../Dist/mod.ts';
export { KeyValue } from '../../KeyValue/mod.ts';
export { ObjectView } from '../../ObjectView/mod.ts';
export { Player } from '../../Player/mod.ts';
export { Spinners } from '../../Spinners/mod.ts';
export { Icons } from '../../ui.Icons.ts';

/**
 * Helpers:
 */
export function dur(ms: t.Msecs = 0, empty = '-') {
  return ms ? Time.Duration.create(ms).format({ round: 0 }) : empty;
}
