/**
 * Immutable [Json/Patch/ObjectPath] tools using Immer-js as the
 * underlying Immutable<T> implementation.
 * @module
 *
 * @example
 * ```ts
 * import { Json } from '@sys/driver-immer/json'
 *
 * type T = { count: number; };
 * const state = Json.PatchState.create<T>({ count: 0 });
 * state.change((d) => d.count += 1);
 *
 * ```
 */
import type { ImmerJsonLib } from './t.ts';

import { Is, Obj, Json as Util } from '../common.ts';
import { Patch } from '../m.Json.Patch/mod.ts';
import { PatchState } from '../m.Json.PatchState/mod.ts';

/**
 * Library: Immutable [Json/Patch/ObjectPath] tools using ImmerJS
 * as the underlying Immutable<T> implementation.
 */
export const Json: ImmerJsonLib = {
  /** Tools for working with patches */
  Patch,

  /** Immutable<T> implemetation over Immer. */
  PatchState,

  /** Object-path tools for mapping changes into the Immutable<T> state objects. */
  Path: Obj.Path,

  /** Determine if the input is a JSON structure. */
  isJson: Is.json,

  /** Convert the given input to a serlalized JSON string. */
  stringify: Util.stringify,
} as const;

export default Json;
