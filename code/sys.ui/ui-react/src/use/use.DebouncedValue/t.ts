import type { t } from '../common.ts';

/**
 * Delays a value update until it stays stable for the given time-window.
 *
 * @param value  The incoming (rapidly changing) value.
 * @param ms     How long (in ms) the value must stay unchanged before publishing.
 */
export type UseDebouncedValue = <T>(value: T, ms?: t.Msecs) => T;
