/**
 * @module
 * Immutable Json/Path tools using Immer-js as the underlying Immutable<T> provider.
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

import { Is, ObjectPath as Path, Json as Util, type t } from '../common.ts';
import { Patch } from '../m.Json.Patch/mod.ts';
import { PatchState } from '../m.Json.PatchState/mod.ts';

export const Json: t.ImmerJsonLib = {
  Patch,
  PatchState,
  Path,
  isJson: Is.json,
  stringify: Util.stringify,
} as const;
