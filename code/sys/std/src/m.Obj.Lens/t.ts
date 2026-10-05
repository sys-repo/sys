import type { t } from './common.ts';
import type * as TIs from './t/t.is.ts';

type O = Record<string, unknown>;
type PathInput = t.PathLike | undefined | null;

export type * from './t/t.lens.ts';
export type * from './t/t.toObject.ts';

/**
 * Library surface for Obj.Path.Lens (no implementation here; types only).
 */
export type Lib = {
  /** Guard checks on value types. */
  readonly Is: Is.Lib;

  /** Create an unbound lens at a path. Accepts pointer string or ObjectPath. */
  at<T = unknown>(...path: PathInput[]): t.Obj.Lens.Unbound<T>;

  /**
   * Bind a subject to an optional path. Equivalent to: Obj.at(path).bind(subject).
   * When `path` is omitted, binds at the root [].
   */
  bind<T = unknown, S extends O = O>(subject: S, ...path: PathInput[]): t.Obj.Lens.Ref<S, T>;

  /**
   * Produce a plain-POJO snapshot where any bound lens refs are replaced with their `.get()` values.
   * - Depth-limited to avoid huge graphs / cycles.
   * - Skips accessor getters by default (non-reentrant).
   */
  toObject<T>(input: T, opts?: t.Obj.Lens.ToObjectOptions): t.Obj.Lens.Unwrap<T>;

  /** Readonly variants. */
  readonly Readonly: {
    at<T = unknown>(...path: PathInput[]): t.Obj.Lens.ReadonlyUnbound<T>;

    /**
     * Readonly variant of `bind`. Equivalent to: Obj.Readonly.at(path).bind(subject).
     * When `path` is omitted, binds at the root [].
     */
    bind<T = unknown, S extends O = O>(
      subject: S,
      ...path: PathInput[]
    ): t.Obj.Lens.ReadonlyRef<S, T>;
  };
};

/**
 * Guard checks for object lens values.
 */
export declare namespace Is {
  /** Guard checks on value types. */
  export type Lib = TIs.Lib;
}
