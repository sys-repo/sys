import { Command } from './Command.ts';
import { Is } from './PatchState.Is.ts';
import { create } from './PatchState.impl.ts';
import { toObject, type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Simple safe/immutable memory state for a single item.
 */
export type ImmerPatchStateLib = {
  readonly Is: t.PatchStateIsLib;
  readonly Command: t.PatchStateCommandLib;

  /**
   * Initialize a new `PatchState` object.
   */
  create<T extends O, E = t.PatchStateEvents<T>>(
    initial: T,
    options?: {
      typename?: string;
      events?: t.PatchStateEventFactory<T, E>;
      onChange?: t.PatchChangeHandler<T>;
    },
  ): t.PatchState<T, E>;

  /**
   * Convert a draft (proxied instance) object into a simple object.
   * See: https://immerjs.github.io/immer/docs/original
   */
  toObject<T extends O>(input: any): T;
};

export const PatchState = {
  Is,
  Command,
  create,
  toObject,
} as const;
