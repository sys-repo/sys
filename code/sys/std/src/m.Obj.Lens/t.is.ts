import type { t } from './common.ts';

/**
 * Guard checks on value types.
 */
export type ObjLensIsLib = {
  /** True if `v` is a bound lens and exposes no mutating ops. */
  readonly(v?: unknown): boolean;
  /** Unbound lens (path-only builder). */
  lens(v?: unknown): v is t.ObjLens<unknown>;
  /** Any bound lens (read-only or writable). */
  lensRef(v?: unknown): v is t.ReadonlyObjLensRef<any, unknown> | t.ObjLensRef<any, unknown>;
  /** Bound read-only lens. */
  lensRefReadonly(v?: unknown): v is t.ReadonlyObjLensRef<any, unknown>;
  /** Bound writable lens. */
  lensRefWritable(v?: unknown): v is t.ObjLensRef<any, unknown>;
};
