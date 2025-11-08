import type { t } from './common.ts';

type O = Record<string, unknown>;

export type * from './t.internal.ts';

/**
 * Immutable Flags (type guards).
 */
export type ImmutableIsLib = {
  readonly objectPath: t.StdIsLib['objectPath'];
  immutable<D, P = unknown>(input: any): input is t.Immutable<D, P>;
  immutableRef<D, P = unknown, E = unknown>(input: any): input is t.ImmutableRef<D, P, E>;
  proxy<T extends O>(input: any): input is T;
};

/**
 * Type delegate for `toObject`.
 * Currently identity; reserved for detaching branded/proxy shapes in future.
 */
export type UnwrapImmutable<T> = T;
