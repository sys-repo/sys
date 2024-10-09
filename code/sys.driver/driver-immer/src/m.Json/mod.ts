import { Is, ObjectPath as Path, Json as Util, type t } from '../common.ts';
import { Patch } from '../m.Json.Patch/mod.ts';
import { PatchState } from '../m.Json.PatchState/mod.ts';

/**
 * @module
 * Immutable Json/Path tools using Immer-js as the underlying Immutable<T> provider.
 */
export const Json: t.ImmerJsonLib = {
  Patch,
  PatchState,
  Path,
  isJson: Is.json,
  stringify: Util.stringify,
} as const;
