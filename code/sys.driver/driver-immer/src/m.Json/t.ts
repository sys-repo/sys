import type { t } from '../common.ts';

/**
 * Library: Immutable Json/Patch/ObjectPath tools using Immer-js as the
 * underlying Immutable<T> implementation.
 */
export type ImmerJsonLib = {
  /** Tools for working with patches */
  readonly Patch: t.PatchToolLib;

  /** Immutable<T> implemetation over Immer.  */
  readonly PatchState: t.ImmerPatchStateLib;

  /** Object-path tools for mapping changes into the Immutable<T> state objects. */
  readonly Path: t.ObjectPathLib;

  /** Determine if the input is a JSON structure. */
  isJson: t.CommonIsLib['json'];

  /** Convert the given input to a serlalized JSON string. */
  stringify: t.JsonLib['stringify'];
};
