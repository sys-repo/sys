import type * as t from '../-spec.t/t.ts';
import { Time } from '../common.ts';

export { t };

/** Libs: */
export * from '../common.ts';

/** Components: */
export { Bullet } from '../../Bullet/mod.ts';
export { Cropmarks } from '../../Cropmarks/mod.ts';
export { Dist } from '../../Dist/mod.ts';
export { KeyValue } from '../../KeyValue/mod.ts';
export { ObjectView } from '../../ObjectView/mod.ts';
export { Player } from '../../Player/mod.ts';
export { Icons } from '../../ui.Icons.ts';

/**
 * Helpers:
 */
export function dur(ms: t.Msecs = 0, empty = '-') {
  return ms ? String(Time.Duration.create(ms)) : empty;
}
