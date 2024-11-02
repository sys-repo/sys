/**
 * @module
 * Driver for working with Immer as the immutability strategy
 * for an `Immutable<T>` implemenation.
 *
 * @example
 * ```ts
 * import { pkg, Json, Patch, PatchState } from '@sys/driver-immer';
 *
 * type T = { count: number; };
 * const state = PatchState.create<T>({ count: 0 });
 * console.log('current:', state.current);          // ← { count: 0 }
 *
 * state.change((d) => d.count = 123);
 * console.log('current:', state.current);          // ← { count: 123 }
 *
 * const events = state.events();
 * events.$.subscribe((e) => console.log(e));       // <event> stream: 💦
 * ```
 */
export { pkg } from './pkg.ts';
export type * as t from './types.ts';

export { Patch } from './m.Json.Patch/mod.ts';
export { PatchState } from './m.Json.PatchState/mod.ts';
export { Json } from './m.Json/mod.ts';
