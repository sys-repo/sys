import { type t } from '../common.ts';

/** Virtual clock time (milliseconds) on a composed timeline. */
export type VTime = t.Msecs & { readonly __brand: 'VirtualTime' };

/**
 * Canonical helpers for `VTime`, the branded virtual timeline millisecond type.
 */
export type VTimeLib = {
  /** Convert plain milliseconds into a branded `VTime` value. */
  fromMsecs(ms: t.Msecs): t.VTime;
  /** Extract raw milliseconds from a branded `VTime`. */
  toMsecs(v: t.VTime): t.Msecs;
  /** The zero point (0 ms) of the virtual timeline. */
  zero: t.VTime;
};
