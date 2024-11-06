import { Command } from './Command.ts';
import { Is } from './PatchState.Is.ts';
import { create } from './PatchState.impl.ts';
import { toObject, type t } from './common.ts';

/**
 * Simple/safe JSON/Patch driven Immutable<T> object
 * using Immer as the underlying immutability implementation.
 */
export const PatchState: t.ImmerPatchStateLib = {
  /** Type validation helpers. */
  Is,

  /** Tools for working with properties that act like an command/event stream. */
  Command,

  /** Initialize a new `PatchState` Immutable<T> object. */
  create,

  /**
   * Convert a draft (proxied instance) object into a simple object.
   * See: https://immerjs.github.io/immer/docs/original
   */
  toObject,
} as const;
