import type { t } from './common.ts';

/**
 * Guard checks on value types.
 */
export type Lib = {
  /** True if `v` is a bound lens and exposes no mutating ops. */
  readonly(v?: unknown): boolean;
  /** Unbound lens (path-only builder). */
  lens(v?: unknown): v is t.Obj.Lens.Unbound<unknown>;
  /** Any bound lens (read-only or writable). */
  lensRef(
    v?: unknown,
  ): v is
    | t.Obj.Lens.ReadonlyRef<Record<string, unknown>, unknown>
    | t.Obj.Lens.Ref<Record<string, unknown>, unknown>;
  /** Bound read-only lens. */
  lensRefReadonly(v?: unknown): v is t.Obj.Lens.ReadonlyRef<Record<string, unknown>, unknown>;
  /** Bound writable lens. */
  lensRefWritable(v?: unknown): v is t.Obj.Lens.Ref<Record<string, unknown>, unknown>;
};
