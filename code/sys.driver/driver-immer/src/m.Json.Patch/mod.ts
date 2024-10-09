/**
 * @module
 * Patch
 * Standard:
 *    RFC-6902 JSON patch standard
 *    https://tools.ietf.org/html/rfc6902
 *
 *    This subset of `op` values is what the [immer] state library uses.
 *    https://github.com/immerjs/immer
 *
 * @example
 * ```ts
 * import { Patch } from '@sys/driver-immer/json/patch';
 *
 * type T = { count: number; };
 * let obj: T = { count: 0 };
 *
 * const change = Patch.change(obj, (d) => d.count = 123);
 * obj = Patch.apply(obj, change.patches);

* ```
 */
export { Patch, toObject } from './m.Patch.ts';
