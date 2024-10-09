/**
 * @module
 * Driver for working with Immer as the immutability strategy
 * for an `Immutable<T>` implemenation.
 *
 * @example
 * ```ts
 * import { Pkg, Json, Patch, PatchState } from '@sys/driver-immer';
 * ```
 */
export { Pkg } from './common.ts';

export { Json } from './m.Json/mod.ts';
export { Patch } from './m.Json.Patch/mod.ts';
export { PatchState } from './m.Json.PatchState/mod.ts';
