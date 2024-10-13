/**
 * @module
 * Simple/safe JSON/Patch driven Immutable<T> object
 * using Immer as the underlying immutability implementation.
 *
 * @example
 * ```ts
 * import PatchState from '@sys/driver-immer/json/patch-state';
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
export { PatchState, PatchState as default } from './PatchState.ts';
